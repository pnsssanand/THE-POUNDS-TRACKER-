import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  getUpcomingPayments, 
  getIncomingPayments,
  addUpcomingPayment,
  updateUpcomingPayment,
  deleteUpcomingPayment,
  addIncomingPayment,
  updateIncomingPayment,
  deleteIncomingPayment
} from "../services/paymentService";
import { getSettings } from "../services/userService";
import type { UpcomingPayment, IncomingPayment, UserSettings } from "../types";
import { formatMoney, formatINR, formatDateUK, getStoredGbpRate } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Check, Plus, Trash2, Clock, CheckCircle2, RefreshCw, Edit2, ArrowLeftRight } from "lucide-react";

export const Route = createFileRoute("/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [upcoming, setUpcoming] = useState<UpcomingPayment[]>([]);
  const [incoming, setIncoming] = useState<IncomingPayment[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const gbpRate = settings?.gbpToInrRate || getStoredGbpRate();

  const loadData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [upData, inData, sData] = await Promise.all([
        getUpcomingPayments(uid),
        getIncomingPayments(uid),
        getSettings(uid)
      ]);
      setUpcoming(upData);
      setIncoming(inData);
      setSettings(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid]);

  const totalUpcomingBills = upcoming
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpectedIncome = incoming
    .filter((p) => p.status === "expected")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-zinc-500 mt-1">Manage your upcoming bills and expected income.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Upcoming Bills to Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatMoney(totalUpcomingBills)}</div>
            <p className="text-xs font-semibold text-zinc-500 mt-1">
              ≈ {formatINR(totalUpcomingBills, gbpRate)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Total Expected Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+{formatMoney(totalExpectedIncome)}</div>
            <p className="text-xs font-semibold text-zinc-500 mt-1">
              ≈ {formatINR(totalExpectedIncome, gbpRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
          <TabsTrigger value="incoming">Expected Income</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          <UpcomingSection uid={uid} upcoming={upcoming} loading={loading} reload={loadData} gbpRate={gbpRate} />
        </TabsContent>

        <TabsContent value="incoming" className="mt-6 space-y-4">
          <IncomingSection uid={uid} incoming={incoming} reload={loadData} gbpRate={gbpRate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UpcomingSection({ 
  uid, 
  upcoming, 
  loading, 
  reload, 
  gbpRate 
}: { 
  uid?: string; 
  upcoming: UpcomingPayment[]; 
  loading: boolean; 
  reload: () => void;
  gbpRate: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"GBP" | "INR">("GBP");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState("Bill");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pending = upcoming.filter(p => p.status === "pending").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const paid = upcoming.filter(p => p.status === "paid").sort((a, b) => b.dueDate.localeCompare(a.dueDate));

  const handleSwapCurrency = () => {
    const next = currency === "GBP" ? "INR" : "GBP";
    setCurrency(next);
    if (amount && !isNaN(parseFloat(amount))) {
      const val = parseFloat(amount);
      if (next === "INR") {
        setAmount((val * gbpRate).toFixed(0));
      } else {
        setAmount((val / gbpRate).toFixed(2));
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName(""); 
    setAmount(""); 
    setCurrency("GBP");
    setDueDate(new Date().toISOString().split('T')[0]); 
    setCategory("Bill"); 
    setNotes("");
  };

  const handleEdit = (p: UpcomingPayment) => {
    setEditingId(p.id);
    setName(p.payerName);
    setAmount(p.amount.toString());
    setCurrency("GBP");
    setDueDate(p.dueDate);
    setCategory(p.category);
    setNotes(p.notes || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setIsSubmitting(true);
    try {
      const raw = parseFloat(amount);
      const finalAmount = currency === "INR" ? Number((raw / gbpRate).toFixed(2)) : raw;
      const input = {
        payerName: name,
        amount: finalAmount,
        dueDate,
        category,
        status: "pending" as const,
        notes
      };
      if (editingId) {
        await updateUpcomingPayment(uid, editingId, input);
      } else {
        await addUpcomingPayment(uid, input);
      }
      setIsOpen(false);
      resetForm();
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (!uid) return;
    await updateUpcomingPayment(uid, id, { status: "paid" });
    reload();
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    if (confirm("Delete this payment?")) {
      await deleteUpcomingPayment(uid, id);
      reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Bills to Pay</h2>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if(!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Bill</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader><DialogTitle>{editingId ? "Edit Bill" : "Add Upcoming Payment"}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Payment Name (e.g. Rent)</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bill-amount">Amount ({currency === "GBP" ? "£" : "₹"})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-1.5 text-[11px] flex items-center gap-1 border-orange-500/30 text-orange-700 dark:text-orange-300"
                        onClick={handleSwapCurrency}
                        title="Swap currency"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{currency === "GBP" ? "£→₹" : "₹→£"}</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                        {currency === "GBP" ? "£" : "₹"}
                      </span>
                      <Input
                        id="bill-amount"
                        type="number"
                        step={currency === "GBP" ? "0.01" : "1"}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="pl-7 pr-3"
                        required
                      />
                    </div>
                    {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                      <p className="text-[11px] text-zinc-500 flex items-center justify-between px-0.5">
                        <span>Equivalent:</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {currency === "GBP"
                            ? `≈ ₹${Math.round(parseFloat(amount) * gbpRate).toLocaleString("en-IN")}`
                            : `≈ £${(parseFloat(amount) / gbpRate).toFixed(2)}`}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bill">Bill</SelectItem>
                      <SelectItem value="Subscription">Subscription</SelectItem>
                      <SelectItem value="Rent">Rent</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-zinc-500 animate-pulse">
            Loading payments...
          </div>
        ) : pending.length > 0 ? (
          pending.map(p => (
            <Card key={p.id} className="shadow-sm border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{p.payerName}</h3>
                    <div className="flex items-center text-sm text-zinc-500 mt-1">
                      <Clock className="w-4 h-4 mr-1" /> Due: {formatDateUK(p.dueDate)}
                    </div>
                    <span className="inline-block mt-2 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">{p.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-600">{formatMoney(p.amount)}</div>
                    <div className="text-xs font-semibold text-zinc-500 mt-0.5">≈ {formatINR(p.amount, gbpRate)}</div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="text-blue-500">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkPaid(p.id)} className="text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100">
                    <Check className="w-4 h-4 mr-1" /> Mark Paid
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No upcoming bills. You're all caught up!
          </div>
        )}
      </div>

      {paid.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-zinc-500 mb-4">Recently Paid</h3>
          <div className="space-y-3">
            {paid.slice(0, 5).map(p => (
              <div key={p.id} className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium text-sm line-through">{p.payerName}</p>
                    <p className="text-xs text-zinc-500">Was due {formatDateUK(p.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatMoney(p.amount)}</div>
                  <div className="text-[11px] text-zinc-400">≈ {formatINR(p.amount, gbpRate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IncomingSection({ 
  uid, 
  incoming, 
  reload, 
  gbpRate 
}: { 
  uid?: string; 
  incoming: IncomingPayment[]; 
  reload: () => void;
  gbpRate: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"GBP" | "INR">("GBP");
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expected = incoming.filter(p => p.status === "expected").sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
  const received = incoming.filter(p => p.status === "received").sort((a, b) => b.expectedDate.localeCompare(a.expectedDate));

  const handleSwapCurrency = () => {
    const next = currency === "GBP" ? "INR" : "GBP";
    setCurrency(next);
    if (amount && !isNaN(parseFloat(amount))) {
      const val = parseFloat(amount);
      if (next === "INR") {
        setAmount((val * gbpRate).toFixed(0));
      } else {
        setAmount((val / gbpRate).toFixed(2));
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setPayer(""); 
    setAmount(""); 
    setCurrency("GBP");
    setExpectedDate(new Date().toISOString().split('T')[0]); 
    setNotes("");
  };

  const handleEdit = (p: IncomingPayment) => {
    setEditingId(p.id);
    setPayer(p.payerName);
    setAmount(p.amount.toString());
    setCurrency("GBP");
    setExpectedDate(p.expectedDate);
    setNotes(p.notes || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setIsSubmitting(true);
    try {
      const raw = parseFloat(amount);
      const finalAmount = currency === "INR" ? Number((raw / gbpRate).toFixed(2)) : raw;
      const input = {
        payerName: payer,
        amount: finalAmount,
        expectedDate,
        status: "expected" as const,
        notes
      };
      if (editingId) {
        await updateIncomingPayment(uid, editingId, input);
      } else {
        await addIncomingPayment(uid, input);
      }
      setIsOpen(false);
      resetForm();
      reload();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkReceived = async (id: string) => {
    if (!uid) return;
    await updateIncomingPayment(uid, id, { status: "received" });
    reload();
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    if (confirm("Delete this incoming payment?")) {
      await deleteIncomingPayment(uid, id);
      reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Expected Income</h2>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if(!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Income</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader><DialogTitle>{editingId ? "Edit Expected Income" : "Add Expected Income"}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Source / Payer Name</Label>
                  <Input value={payer} onChange={e => setPayer(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="incoming-amount">Amount ({currency === "GBP" ? "£" : "₹"})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-1.5 text-[11px] flex items-center gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        onClick={handleSwapCurrency}
                        title="Swap currency"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>{currency === "GBP" ? "£→₹" : "₹→£"}</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                        {currency === "GBP" ? "£" : "₹"}
                      </span>
                      <Input
                        id="incoming-amount"
                        type="number"
                        step={currency === "GBP" ? "0.01" : "1"}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="pl-7 pr-3"
                        required
                      />
                    </div>
                    {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                      <p className="text-[11px] text-zinc-500 flex items-center justify-between px-0.5">
                        <span>Equivalent:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {currency === "GBP"
                            ? `≈ ₹${Math.round(parseFloat(amount) * gbpRate).toLocaleString("en-IN")}`
                            : `≈ £${(parseFloat(amount) / gbpRate).toFixed(2)}`}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Expected Date</Label>
                    <Input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {expected.map(p => (
          <Card key={p.id} className="shadow-sm border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{p.payerName}</h3>
                  <div className="flex items-center text-sm text-zinc-500 mt-1">
                    <Clock className="w-4 h-4 mr-1" /> Expected: {formatDateUK(p.expectedDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-emerald-600">+{formatMoney(p.amount)}</div>
                  <div className="text-xs font-semibold text-zinc-500 mt-0.5">≈ {formatINR(p.amount, gbpRate)}</div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="text-blue-500">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleMarkReceived(p.id)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                  <Check className="w-4 h-4 mr-1" /> Mark Received
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {expected.length === 0 && (
          <div className="col-span-2 text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No expected income.
          </div>
        )}
      </div>

      {received.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-zinc-500 mb-4">Recently Received</h3>
          <div className="space-y-3">
            {received.slice(0, 5).map(p => (
              <div key={p.id} className="flex justify-between items-center p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 opacity-60">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm line-through">{p.payerName}</p>
                    <p className="text-xs text-zinc-500">Expected {formatDateUK(p.expectedDate)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-emerald-600">+{formatMoney(p.amount)}</div>
                  <div className="text-[11px] text-zinc-400">≈ {formatINR(p.amount, gbpRate)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
