import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  getExpenses, 
  addExpense, 
  updateExpense,
  deleteExpense,
  EXPENSE_CATEGORIES
} from "../services/expenseService";
import { getSettings, updateSettings, DEFAULT_SETTINGS } from "../services/userService";
import type { Expense, UserSettings } from "../types";
import { calculateDailyExpenses, calculateMonthlyExpenses, calculateTotalExpenses } from "../lib/calc";
import { formatMoney, formatINR, formatDateUK, formatSignedMoney, monthKey, previousMonthKey, getStoredGbpRate, setStoredGbpRate } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Checkbox } from "../components/ui/checkbox";
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit2, 
  Landmark, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  X,
  ArrowLeftRight
} from "lucide-react";
import { cn } from "../lib/utils";

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
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"GBP" | "INR">("GBP");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<typeof EXPENSE_CATEGORIES[number]>("Indian Store");
  const [paymentMode, setPaymentMode] = useState<"cash" | "card">("cash");
  const [bankName, setBankName] = useState("");
  const [notes, setNotes] = useState("");
  const [savePreferred, setSavePreferred] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gbpRate = settings?.gbpToInrRate || getStoredGbpRate();

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

  // Bank Balance card state
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [isSavingBalance, setIsSavingBalance] = useState(false);
  const balanceInputRef = useRef<HTMLInputElement>(null);
  const lastTapTimeRef = useRef<number>(0);

  const handleStartEditBalance = () => {
    setBalanceInput((settings?.bankBalance ?? 0).toString());
    setIsEditingBalance(true);
    setTimeout(() => {
      balanceInputRef.current?.focus();
      balanceInputRef.current?.select();
    }, 50);
  };

  const handleCardDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;
    handleStartEditBalance();
  };

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      e.preventDefault();
      handleStartEditBalance();
    }
    lastTapTimeRef.current = now;
  };

  const handleSaveBalance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!uid) return;

    const parsed = parseFloat(balanceInput);
    if (isNaN(parsed)) return;

    setIsSavingBalance(true);
    try {
      await updateSettings(uid, { bankBalance: parsed });
      setSettings((prev) =>
        prev ? { ...prev, bankBalance: parsed } : { ...DEFAULT_SETTINGS, bankBalance: parsed }
      );
      setIsEditingBalance(false);
    } catch (error) {
      console.error("Failed to update bank balance:", error);
    } finally {
      setIsSavingBalance(false);
    }
  };

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
      if (s?.gbpToInrRate) {
        setStoredGbpRate(s.gbpToInrRate);
      }
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
    setCurrency("GBP");
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
      const rawAmount = parseFloat(amount);
      const expenseAmount = currency === "INR" 
        ? Math.round((rawAmount / gbpRate) * 100) / 100 
        : rawAmount;

      const input = {
        purpose,
        amount: expenseAmount,
        date,
        category,
        paymentMode,
        bankName: paymentMode === "card" ? bankName : undefined,
        notes,
      };

      const currentBal = settings?.bankBalance || 0;
      let newBalance = currentBal;

      if (editingId) {
        const existing = expenses.find(e => e.id === editingId);
        const oldAmount = existing?.amount || 0;
        newBalance = currentBal + oldAmount - expenseAmount;
        await updateExpense(uid, editingId, input);
      } else {
        newBalance = currentBal - expenseAmount;
        await addExpense(uid, input);
      }

      await updateSettings(uid, { bankBalance: newBalance });
      setSettings((prev) =>
        prev ? { ...prev, bankBalance: newBalance } : { ...DEFAULT_SETTINGS, bankBalance: newBalance }
      );

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
    setCurrency("GBP");
    setDate(new Date().toISOString().split('T')[0]);
    setCategory("Indian Store");
    setPaymentMode(settings?.preferredPaymentMode || "cash");
    setBankName(settings?.preferredBank || "");
    setNotes("");
    setSavePreferred(false);
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    if (confirm("Are you sure you want to delete this expense?")) {
      const expenseToDelete = expenses.find(e => e.id === id);
      await deleteExpense(uid, id);
      if (expenseToDelete && settings) {
        const restoredBalance = (settings.bankBalance || 0) + expenseToDelete.amount;
        await updateSettings(uid, { bankBalance: restoredBalance });
        setSettings((prev) =>
          prev ? { ...prev, bankBalance: restoredBalance } : null
        );
      }
      loadData();
    }
  };

  const availableMonths = Array.from(new Set([
    monthKey(),
    ...expenses.map(e => e.date.slice(0, 7))
  ])).sort((a, b) => b.localeCompare(a));

  const todayTotal = calculateDailyExpenses(expenses);
  const selectedMonthTotal = calculateMonthlyExpenses(expenses, selectedMonth);
  const previousMonthTotal = calculateMonthlyExpenses(expenses, previousMonthKey(selectedMonth));
  const absoluteTotal = calculateTotalExpenses(expenses);

  const currentBankBalance = settings?.bankBalance ?? 0;
  const netBalance = currentBankBalance - selectedMonthTotal;
  const isPositive = netBalance >= 0;

  const previewParsed = parseFloat(balanceInput);
  const previewNet = !isNaN(previewParsed) ? previewParsed - selectedMonthTotal : null;

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
    const matchesMonth = e.date.startsWith(selectedMonth);
    return matchesSearch && matchesCategory && matchesMonth;
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
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="amount">Amount ({currency === "GBP" ? "£" : "₹"})</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-5 px-1.5 text-[10px] flex items-center gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50"
                        onClick={handleSwapCurrency}
                        title="Swap currency between GBP and INR"
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5" />
                        <span>{currency === "GBP" ? "£ → ₹" : "₹ → £"}</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                        {currency === "GBP" ? "£" : "₹"}
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        placeholder="0.00"
                        className="pl-7"
                      />
                    </div>
                    {amount && !isNaN(parseFloat(amount)) && (
                      <p className="text-[10px] text-zinc-500">
                        {currency === "GBP" ? (
                          <>≈ ₹{(parseFloat(amount) * gbpRate).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</>
                        ) : (
                          <>≈ £{(parseFloat(amount) / gbpRate).toFixed(2)}</>
                        )}
                      </p>
                    )}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month's Expenses (£)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(selectedMonthTotal)}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month's Expenses (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatINR(selectedMonthTotal)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previous Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(previousMonthTotal)}</div>
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

        {/* Current Bank Balance Card */}
        {isEditingBalance ? (
          <Card className="shadow-md ring-2 ring-emerald-500/40 border-emerald-500 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bank Balance</span>
              </CardTitle>
              <span className="text-[10px] text-zinc-400">Press Enter ↵</span>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBalance} className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400">
                    £
                  </span>
                  <Input
                    ref={balanceInputRef}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balanceInput}
                    onChange={(e) => setBalanceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setIsEditingBalance(false);
                      }
                    }}
                    className="pl-7 pr-2 h-9 text-base font-bold bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 focus-visible:ring-emerald-500"
                    autoFocus
                  />
                </div>

                {previewNet !== null && (
                  <div className="flex items-center justify-between text-xs px-0.5 text-zinc-500">
                    <span>Status vs Month:</span>
                    <span
                      className={cn(
                        "font-semibold flex items-center gap-1",
                        previewNet >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {previewNet >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{previewNet >= 0 ? "Positive" : "Negative"}</span>
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-0.5">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex-1"
                    disabled={isSavingBalance}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {isSavingBalance ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs text-zinc-600 dark:text-zinc-400"
                    onClick={() => setIsEditingBalance(false)}
                    disabled={isSavingBalance}
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card
            className={cn(
              "shadow-sm transition-all duration-200 select-none relative group cursor-pointer",
              "hover:border-emerald-400/80 hover:shadow-md",
              isPositive
                ? "hover:ring-1 hover:ring-emerald-500/20"
                : "hover:ring-1 hover:ring-red-500/20"
            )}
            onDoubleClick={handleCardDoubleClick}
            onTouchEnd={handleCardTouchEnd}
            title="Double-tap or double-click to enter bank balance"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
                <Landmark className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 -mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartEditBalance();
                }}
                title="Edit balance"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-1">
                <div>
                  <div className="text-2xl font-bold tracking-tight">
                    {formatMoney(currentBankBalance)}
                  </div>
                  <div className="text-xs font-semibold text-zinc-500 mt-0.5">
                    ≈ {formatINR(currentBankBalance, gbpRate)}
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 transition-colors",
                    isPositive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                  )}
                  {isPositive ? "Positive" : "Negative"}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
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
          {loading ? (
            <div className="text-center py-12 text-zinc-500 animate-pulse">
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
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
                    <TableHead>Amount (INR)</TableHead>
                    <TableHead className="text-right">Amount (£)</TableHead>
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
                      <TableCell className="text-zinc-500 font-medium">
                        {formatINR(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatMoney(expense.amount)}</span>
                      </TableCell>
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
