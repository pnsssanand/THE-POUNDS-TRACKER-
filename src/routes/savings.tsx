import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getSettings, updateSettings } from "../services/userService";
import { getSavings, addSaving, updateSaving, deleteSaving } from "../services/savingsService";
import type { Saving, UserSettings } from "../types";
import { hashPin } from "../lib/pin";
import { formatMoney } from "../lib/format";
import { calculateTotalSavings } from "../lib/calc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Lock, Unlock, ShieldCheck, Plus, Trash2, Wallet, RefreshCw, Edit2 } from "lucide-react";

export const Route = createFileRoute("/savings")({
  component: SavingsPage,
});

function SavingsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [loading, setLoading] = useState(true);

  // Vault state
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"cash" | "bank">("bank");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!uid) return;
    try {
      const data = await getSavings(uid);
      setSavings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!uid) return;
    
    getSettings(uid).then((s) => {
      setSettings(s);
      setLoading(false);
    });

    loadData();
  }, [uid]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !settings) return;

    if (!settings.savingsPinHash) {
      // Create PIN
      if (pinInput !== pinConfirm) {
        setErrorMsg("PINs do not match.");
        return;
      }
      if (pinInput.length < 4) {
        setErrorMsg("PIN must be at least 4 digits.");
        return;
      }
      const hashed = await hashPin(uid, pinInput);
      await updateSettings(uid, { savingsPinHash: hashed });
      setSettings({ ...settings, savingsPinHash: hashed });
      setUnlocked(true);
      setErrorMsg("");
    } else {
      // Verify PIN
      const hashed = await hashPin(uid, pinInput);
      if (hashed === settings.savingsPinHash) {
        setUnlocked(true);
        setErrorMsg("");
      } else {
        setErrorMsg("Incorrect PIN");
        setPinInput("");
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); setAccountType("bank"); setAccountName(""); setAmount("");
  };

  const handleEdit = (s: Saving) => {
    setEditingId(s.id);
    setName(s.name);
    setAccountType(s.accountType);
    setAccountName(s.accountName);
    setAmount(s.amount.toString());
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setIsSubmitting(true);
    try {
      const input = {
        name,
        accountType,
        accountName,
        amount: parseFloat(amount)
      };
      
      if (editingId) {
        await updateSaving(uid, editingId, input);
      } else {
        await addSaving(uid, input);
      }
      setIsOpen(false);
      resetForm();
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    if (confirm("Delete this savings item?")) {
      await deleteSaving(uid, id);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-zinc-500">Accessing secure vault...</div>
      </div>
    );
  }

  if (!unlocked) {
    const isNew = !settings?.savingsPinHash;
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-emerald-500/20">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            </div>
            <CardTitle>{isNew ? "Create your Savings PIN" : "Unlock Savings Vault"}</CardTitle>
            <CardDescription>
              {isNew ? "Set up a 4-digit PIN to secure your savings data." : "Enter your 4-digit PIN to access your vault."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <Label>PIN</Label>
                <Input 
                  type="password" 
                  maxLength={4} 
                  inputMode="numeric"
                  value={pinInput} 
                  onChange={e => {
                    setPinInput(e.target.value);
                    setErrorMsg("");
                  }} 
                  placeholder="****"
                  className="text-center text-2xl tracking-widest"
                  required 
                />
              </div>
              {isNew && (
                <div className="space-y-2">
                  <Label>Confirm PIN</Label>
                  <Input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric"
                    value={pinConfirm} 
                    onChange={e => {
                      setPinConfirm(e.target.value);
                      setErrorMsg("");
                    }} 
                    placeholder="****"
                    className="text-center text-2xl tracking-widest"
                    required 
                  />
                </div>
              )}
              {errorMsg && <p className="text-sm text-red-500 text-center font-medium">{errorMsg}</p>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                {isNew ? "Set PIN & Unlock" : "Unlock Vault"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = calculateTotalSavings(savings);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Savings Vault</h1>
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-zinc-500 mt-1">Your secured savings overview.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           <Button variant="outline" size="icon" onClick={loadData}>
             <RefreshCw className="w-4 h-4" />
           </Button>
           <Button variant="outline" onClick={() => setUnlocked(false)}>
             <Lock className="w-4 h-4 mr-2" /> Lock
           </Button>
           <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if(!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Savings</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader><DialogTitle>{editingId ? "Edit Savings" : "Add to Vault"}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Savings Name (e.g. Emergency Fund)</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Account Type</Label>
                      <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Account</SelectItem>
                          <SelectItem value="cash">Physical Cash</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{accountType === "bank" ? "Bank Name" : "Location"}</Label>
                      <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder={accountType === "bank" ? "e.g. HSBC" : "e.g. Safe"} required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Amount (£)</Label>
                    <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>Secure Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-emerald-950 text-white border-none shadow-xl">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <Unlock className="w-8 h-8 text-emerald-400 mb-4 opacity-50" />
          <p className="text-emerald-200 font-medium mb-2 tracking-widest uppercase text-sm">Total Secured Savings</p>
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight">{formatMoney(total)}</h2>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {savings.map(s => (
          <Card key={s.id} className="shadow-sm border-t-4 border-t-emerald-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{s.name}</h3>
                  <div className="flex items-center text-sm text-zinc-500 mt-1">
                    <Wallet className="w-4 h-4 mr-1" /> {s.accountType === "bank" ? "Bank:" : "Location:"} {s.accountName}
                  </div>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 -mr-1 -mt-2">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="text-red-500 h-8 w-8 -mr-2 -mt-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{formatMoney(s.amount)}</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {savings.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500">
            Your vault is currently empty. Add some savings to secure them here.
          </div>
        )}
      </div>
    </div>
  );
}
