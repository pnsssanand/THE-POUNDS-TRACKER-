import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  getExpenses, 
  addExpense, 
  updateExpense,
  deleteExpense,
  EXPENSE_CATEGORIES
} from "../services/expenseService";
import { getSettings, updateSettings } from "../services/userService";
import type { Expense, UserSettings } from "../types";
import { calculateDailyExpenses, calculateMonthlyExpenses, calculateTotalExpenses } from "../lib/calc";
import { formatMoney, formatDateUK } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";
import { Plus, Trash2, Search, Filter, RefreshCw, Edit2 } from "lucide-react";

export const Route = createFileRoute("/expenses")({
  component: ExpensesPage,
});

function ExpensesPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<typeof EXPENSE_CATEGORIES[number]>("Other");
  const [paymentMode, setPaymentMode] = useState<"cash" | "card">("cash");
  const [bankName, setBankName] = useState("");
  const [notes, setNotes] = useState("");
  const [savePreferred, setSavePreferred] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await getExpenses(uid);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!uid) return;
    
    getSettings(uid).then((s) => {
      setSettings(s);
      if (s) {
        setPaymentMode(s.preferredPaymentMode);
        if (s.preferredBank) {
          setBankName(s.preferredBank);
        }
      }
    });

    loadData();
  }, [uid]);

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setPurpose(expense.purpose);
    setAmount(expense.amount.toString());
    setDate(expense.date);
    setCategory(expense.category);
    setPaymentMode(expense.paymentMode);
    setBankName(expense.bankName || "");
    setNotes(expense.notes || "");
    setSavePreferred(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    
    setIsSubmitting(true);
    try {
      const input = {
        purpose,
        amount: parseFloat(amount),
        date,
        category,
        paymentMode,
        bankName: paymentMode === "card" ? bankName : undefined,
        notes,
      };

      if (editingId) {
        await updateExpense(uid, editingId, input);
      } else {
        await addExpense(uid, input);
      }

      if (savePreferred) {
        await updateSettings(uid, {
          preferredPaymentMode: paymentMode,
          ...(paymentMode === "card" ? { preferredBank: bankName } : {})
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Failed to save expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setPurpose("");
    setAmount("");
    setDate(new Date().toISOString().split('T')[0]);
    setCategory("Other");
    setPaymentMode(settings?.preferredPaymentMode || "cash");
    setBankName(settings?.preferredBank || "");
    setNotes("");
    setSavePreferred(false);
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    if (confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense(uid, id);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading expenses...</div>
      </div>
    );
  }

  const todayTotal = calculateDailyExpenses(expenses);
  const monthTotal = calculateMonthlyExpenses(expenses);
  const absoluteTotal = calculateTotalExpenses(expenses);

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-zinc-500 mt-1">Track and manage your spending.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Expense" : "Add New Expense"}</DialogTitle>
                </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} required placeholder="e.g. Lunch with client" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (£)</Label>
                    <Input id="amount" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMode">Payment Method</Label>
                    <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {paymentMode === "card" && (
                    <div className="grid gap-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Monzo" required />
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra details..." />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox 
                    id="savePreferred" 
                    checked={savePreferred}
                    onCheckedChange={(c) => setSavePreferred(c as boolean)} 
                  />
                  <Label htmlFor="savePreferred" className="text-sm font-normal text-zinc-600">
                    Set as my preferred payment method
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (editingId ? "Save Changes" : "Save Expense")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(todayTotal)}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month's Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(monthTotal)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(absoluteTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle>Expense History</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="Search expenses..." 
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No expenses found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium whitespace-nowrap">{formatDateUK(expense.date)}</TableCell>
                      <TableCell>{expense.purpose}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {expense.category}
                        </span>
                      </TableCell>
                      <TableCell className="capitalize text-zinc-500">
                        {expense.paymentMode} {expense.paymentMode === "card" && expense.bankName ? `(${expense.bankName})` : ''}
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatMoney(expense.amount)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 mr-1">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
