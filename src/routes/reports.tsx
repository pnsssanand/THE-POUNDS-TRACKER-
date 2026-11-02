import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkSessions } from "../services/workService";
import { getExpenses, EXPENSE_CATEGORIES } from "../services/expenseService";
import type { WorkSession, Expense } from "../types";
import { formatMoney, formatINR, formatHours, monthKey, formatDateUK } from "../lib/format";
import { 
  buildMonthlyReport, 
  calculateAverageHourlyEarning,
  monthStatus
} from "../lib/calc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import { Button } from "../components/ui/button";
import { 
  RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  Crown, PieChart as PieChartIcon, Activity, Flame, ShoppingBag, 
  Wallet, Layers
} from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const PIE_COLORS = [
  '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#eab308', '#ef4444', '#6366f1', '#14b8a6', 
  '#d946ef', '#a855f7', '#64748b'
];

const CATEGORY_COLORS: Record<string, string> = {
  "Indian Store": "#f97316",
  "Food": "#10b981",
  "Groceries": "#06b6d4",
  "Transport": "#3b82f6",
  "Rent": "#8b5cf6",
  "Bills": "#ec4899",
  "Shopping": "#eab308",
  "Entertainment": "#6366f1",
  "Education": "#14b8a6",
  "Travel": "#0ea5e9",
  "Family": "#d946ef",
  "Health": "#ef4444",
  "Subscriptions": "#a855f7",
  "Other": "#71717a",
};

function ReportsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());
  const [flowView, setFlowView] = useState<"daily" | "cumulative">("daily");

  const loadData = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [sData, eData] = await Promise.all([
        getWorkSessions(uid),
        getExpenses(uid)
      ]);
      setSessions(sData);
      setExpenses(eData);
    } catch (err) {
      console.error("Failed to load reports data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid]);

  // Generate unique months for selector
  const availableMonths = useMemo(() => {
    return Array.from(new Set([
      monthKey(),
      ...sessions.map(s => s.workDate.slice(0, 7)),
      ...expenses.map(e => e.date.slice(0, 7))
    ])).sort((a, b) => b.localeCompare(a));
  }, [sessions, expenses]);

  // Monthly summary
  const monthlyReport = useMemo(() => {
    return buildMonthlyReport(sessions, expenses, selectedMonth);
  }, [sessions, expenses, selectedMonth]);

  const monthSessions = useMemo(() => {
    return sessions.filter(s => s.workDate.startsWith(selectedMonth));
  }, [sessions, selectedMonth]);

  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(selectedMonth));
  }, [expenses, selectedMonth]);

  const totalExpenseAmount = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  const avgHourly = useMemo(() => {
    return calculateAverageHourlyEarning(monthSessions);
  }, [monthSessions]);

  // Category Spends Analysis
  const categoryStats = useMemo(() => {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    
    // Group all expenses of current month by category
    monthExpenses.forEach(e => {
      const cat = e.category || "Other";
      const current = categoryMap.get(cat) || { amount: 0, count: 0 };
      categoryMap.set(cat, {
        amount: current.amount + e.amount,
        count: current.count + 1,
      });
    });

    const list = [...categoryMap.entries()].map(([category, stats], idx) => ({
      category,
      name: category,
      value: stats.amount,
      amount: stats.amount,
      count: stats.count,
      percentage: totalExpenseAmount > 0 ? (stats.amount / totalExpenseAmount) * 100 : 0,
      color: CATEGORY_COLORS[category] || PIE_COLORS[idx % PIE_COLORS.length] || "#10b981",
    }));

    return list.sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, totalExpenseAmount]);

  // Highest category spends
  const highestCategory = categoryStats[0] || null;
  const secondHighestCategory = categoryStats[1] || null;

  // Flow Chart Data: Timeline of daily incoming vs outgoing money
  const { dailyFlowData, cumulativeFlowData, peakIncomeDay, peakExpenseDay } = useMemo(() => {
    const dateMap = new Map<string, { date: string; rawDate: string; income: number; expenses: number; net: number }>();

    monthSessions.forEach(s => {
      const rawDate = s.workDate;
      const entry = dateMap.get(rawDate) || {
        date: formatDateUK(rawDate),
        rawDate,
        income: 0,
        expenses: 0,
        net: 0,
      };
      entry.income += s.earnings;
      entry.net = entry.income - entry.expenses;
      dateMap.set(rawDate, entry);
    });

    monthExpenses.forEach(e => {
      const rawDate = e.date;
      const entry = dateMap.get(rawDate) || {
        date: formatDateUK(rawDate),
        rawDate,
        income: 0,
        expenses: 0,
        net: 0,
      };
      entry.expenses += e.amount;
      entry.net = entry.income - entry.expenses;
      dateMap.set(rawDate, entry);
    });

    const sortedDaily = [...dateMap.values()].sort((a, b) => a.rawDate.localeCompare(b.rawDate));

    let runningIncome = 0;
    let runningExpenses = 0;
    const cumulative = sortedDaily.map(d => {
      runningIncome += d.income;
      runningExpenses += d.expenses;
      return {
        date: d.date,
        rawDate: d.rawDate,
        income: Number(runningIncome.toFixed(2)),
        expenses: Number(runningExpenses.toFixed(2)),
        net: Number((runningIncome - runningExpenses).toFixed(2)),
      };
    });

    let peakInc = { date: "-", amount: 0 };
    let peakExp = { date: "-", amount: 0 };
    sortedDaily.forEach(d => {
      if (d.income > peakInc.amount) peakInc = { date: d.date, amount: d.income };
      if (d.expenses > peakExp.amount) peakExp = { date: d.date, amount: d.expenses };
    });

    return {
      dailyFlowData: sortedDaily,
      cumulativeFlowData: cumulative,
      peakIncomeDay: peakInc,
      peakExpenseDay: peakExp,
    };
  }, [monthSessions, monthExpenses]);

  // Cashflow comparison data
  const cashflowBarData = [
    { name: "Income", amount: monthlyReport.income, fill: "#10b981" },
    { name: "Expenses", amount: monthlyReport.expenses, fill: "#ef4444" },
  ];

  // Repeated expense purpose data
  const purposeData = useMemo(() => {
    return monthExpenses
      .reduce((acc, curr) => {
        const purpose = curr.purpose.trim().toLowerCase();
        const existing = acc.find(x => x.key === purpose);
        if (existing) {
          existing.amount += curr.amount;
          existing.count += 1;
        } else {
          acc.push({ key: purpose, name: curr.purpose.trim(), amount: curr.amount, count: 1 });
        }
        return acc;
      }, [] as any[])
      .filter(x => x.count > 1)
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-zinc-500 mt-1">Deep dive into your financial data, category spending, and cash flow.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(m => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Primary KPI Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border-emerald-100 dark:border-emerald-950/40 bg-gradient-to-br from-emerald-50/40 to-transparent dark:from-emerald-950/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Monthly Income</CardTitle>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(monthlyReport.income)}</div>
            <p className="text-xs text-zinc-500 mt-1">{formatINR(monthlyReport.income)} · {monthSessions.length} shifts · {formatHours(monthlyReport.workedHours)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-rose-100 dark:border-rose-950/40 bg-gradient-to-br from-rose-50/40 to-transparent dark:from-rose-950/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Amount Spent</CardTitle>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatMoney(monthlyReport.expenses)}</div>
            <p className="text-xs text-zinc-500 mt-1">{formatINR(monthlyReport.expenses)} · {monthExpenses.length} expenses</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Net Balance</CardTitle>
              <Wallet className="w-4 h-4 text-zinc-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyReport.net >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatMoney(monthlyReport.net)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{formatINR(monthlyReport.net)} · {monthStatus(monthlyReport.net)}</p>
          </CardContent>
        </Card>

        {/* Highest Category Spend Highlight Card */}
        <Card className="shadow-sm border-amber-100 dark:border-amber-950/40 bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Highest Category Spend</CardTitle>
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            {highestCategory ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {highestCategory.category}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <div>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                      {formatMoney(highestCategory.amount)}
                    </span>
                    <span className="text-[11px] text-zinc-500 ml-1.5">
                      ≈ {formatINR(highestCategory.amount)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {highestCategory.percentage.toFixed(0)}% of total
                  </Badge>
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-500 py-1">No expenses yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Avg Earnings/Hour</CardTitle>
              <Activity className="w-4 h-4 text-zinc-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(avgHourly)}</div>
            <p className="text-xs text-zinc-500 mt-1">Per clocked hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Highest Category Highlight Banner */}
      {highestCategory && (
        <Card className="shadow-sm border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <CardContent className="p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Top Spending Category</span>
                  <Badge variant="outline" className="border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                    Rank #1
                  </Badge>
                </div>
                <h3 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-0.5">
                  {highestCategory.category}
                </h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Accounts for <span className="font-semibold text-zinc-900 dark:text-zinc-100">{highestCategory.percentage.toFixed(1)}%</span> of all expenses this month ({highestCategory.count} purchases, avg {formatMoney(highestCategory.amount / highestCategory.count)}/purchase)
                </p>
              </div>
            </div>
            <div className="flex flex-row md:flex-col items-baseline md:items-end justify-between w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200 dark:border-zinc-800">
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatMoney(highestCategory.amount)}
              </div>
              <div className="text-xs text-zinc-500 font-medium">
                {formatINR(highestCategory.amount)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cash & Spending Flow Chart */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg font-bold">Money Flow Chart</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Timeline comparison of incoming earnings vs outgoing category spending
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg flex text-xs">
              <button
                type="button"
                onClick={() => setFlowView("daily")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  flowView === "daily" 
                    ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Daily Flow
              </button>
              <button
                type="button"
                onClick={() => setFlowView("cumulative")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  flowView === "cumulative" 
                    ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Cumulative Flow
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-zinc-600 dark:text-zinc-400">Earnings (Inflow):</span>
              <span className="font-bold text-emerald-600">{formatMoney(monthlyReport.income)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="text-zinc-600 dark:text-zinc-400">Expenses (Outflow):</span>
              <span className="font-bold text-rose-600">{formatMoney(monthlyReport.expenses)}</span>
            </div>
            {peakExpenseDay.amount > 0 && (
              <div className="text-zinc-500 ml-auto hidden sm:block">
                Highest spending day: <span className="font-semibold text-rose-600">{peakExpenseDay.date} ({formatMoney(peakExpenseDay.amount)})</span>
              </div>
            )}
          </div>

          <div className="h-[320px] w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-zinc-500 animate-pulse">Loading flow chart...</div>
            ) : dailyFlowData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Activity className="w-8 h-8 opacity-40" />
                <p>No shifts or expenses recorded for {selectedMonth}.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowView === "daily" ? dailyFlowData : cumulativeFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(value) => `£${value}`}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const inc = payload.find(p => p.dataKey === "income")?.value as number || 0;
                      const exp = payload.find(p => p.dataKey === "expenses")?.value as number || 0;
                      const net = inc - exp;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md text-xs space-y-1.5">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{label}</p>
                          <div className="flex justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                            <span>Income:</span>
                            <span className="font-semibold">{formatMoney(inc)}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-rose-600 dark:text-rose-400">
                            <span>Expenses:</span>
                            <span className="font-semibold">{formatMoney(exp)}</span>
                          </div>
                          <div className="border-t pt-1 flex justify-between gap-4 font-bold">
                            <span>Net Flow:</span>
                            <span className={net >= 0 ? "text-emerald-600" : "text-rose-600"}>
                              {net >= 0 ? "+" : ""}{formatMoney(net)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="Income" 
                    stroke="#10b981" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#incomeGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    name="Expenses" 
                    stroke="#ef4444" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#expenseGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Spends Breakdown & Ranking Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {/* Category Distribution Donut Chart */}
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-primary" />
                  Category Spends Share
                </CardTitle>
                <CardDescription>Proportional spending distribution</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                Total: {formatMoney(totalExpenseAmount)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {categoryStats.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={categoryStats} 
                      dataKey="amount" 
                      nameKey="category" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={55}
                      outerRadius={95} 
                      paddingAngle={2}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell 
                          key={`cell-${entry.category}-${index}`} 
                          fill={entry.color || PIE_COLORS[index % PIE_COLORS.length] || "#10b981"} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, item: any) => [
                        `${formatMoney(Number(value))} (${item?.payload?.percentage?.toFixed(1)}%)`, 
                        name
                      ]} 
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-zinc-500 text-sm">
                No category expenses for this month.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Spends Ranking & Progress Bars */}
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Category Spends Ranking
                </CardTitle>
                <CardDescription>
                  Ranked by highest category spends to lowest
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 uppercase font-semibold">Total Category Spends</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatMoney(totalExpenseAmount)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-sm">
                No expenses recorded for this month.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryStats.map((cat, idx) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400" 
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {cat.category}
                        </span>
                        {idx === 0 && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Highest
                          </Badge>
                        )}
                        <span className="text-xs text-zinc-400">
                          ({cat.count} {cat.count === 1 ? "expense" : "expenses"})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatMoney(cat.amount)}
                        </span>
                        <span className="text-xs text-zinc-500 ml-2">
                          ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.max(2, cat.percentage)}%`,
                          backgroundColor: cat.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Repeated Expenses & Cashflow Bar Ratio */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              Repeated Expenses by Purpose
            </CardTitle>
            <CardDescription>Items purchased multiple times in {selectedMonth}</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {purposeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purposeData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.25} />
                  <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `£${value}`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    formatter={(value: any, name: any, props: any) => [`${formatMoney(Number(value))} (${props.payload.count} times)`, 'Spent']} 
                  />
                  <Bar dataKey="amount" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">
                No repeated items found for this month.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Monthly Cashflow Ratio
            </CardTitle>
            <CardDescription>Total earned income vs total category spending</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.25} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: any) => [formatMoney(Number(value)), 'Amount']} />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {cashflowBarData.map((entry, index) => (
                    <Cell key={`cashflow-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
