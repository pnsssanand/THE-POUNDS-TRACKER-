import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getWorkSessions } from "../services/workService";
import { getExpenses } from "../services/expenseService";
import type { WorkSession, Expense } from "../types";
import { formatMoney, formatHours, monthKey, formatDateUK } from "../lib/format";
import { 
  buildMonthlyReport, 
  expensesByCategory, 
  calculateAverageHourlyEarning,
  calculateTotalIncome,
  calculateTotalExpenses,
  monthStatus
} from "../lib/calc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { Button } from "../components/ui/button";
import { RefreshCw } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

function ReportsPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(monthKey());

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [uid]);

  // Generate unique months for the selector
  const availableMonths = Array.from(new Set([
    monthKey(),
    ...sessions.map(s => s.workDate.slice(0, 7)),
    ...expenses.map(e => e.date.slice(0, 7))
  ])).sort((a, b) => b.localeCompare(a));

  const monthlyReport = buildMonthlyReport(sessions, expenses, selectedMonth);
  const catData = expensesByCategory(expenses.filter(e => e.date.startsWith(selectedMonth)));
  const avgHourly = calculateAverageHourlyEarning(sessions.filter(s => s.workDate.startsWith(selectedMonth)));

  const chartData = [
    { name: "Income", amount: monthlyReport.income },
    { name: "Expenses", amount: monthlyReport.expenses },
  ];

  // Daily trend line data
  const trendData = sessions
    .filter(s => s.workDate.startsWith(selectedMonth))
    .reduce((acc, curr) => {
      const date = formatDateUK(curr.workDate);
      const existing = acc.find(x => x.date === date);
      if (existing) existing.income += curr.earnings;
      else acc.push({ date, income: curr.earnings });
      return acc;
    }, [] as any[])
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-zinc-500 mt-1">Deep dive into your financial data.</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Income</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600">{formatMoney(monthlyReport.income)}</div></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{formatMoney(monthlyReport.expenses)}</div></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Balance</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyReport.net >= 0 ? "text-zinc-900 dark:text-zinc-50" : "text-red-600"}`}>
              {formatMoney(monthlyReport.net)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">{monthStatus(monthlyReport.net)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Working Hours</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatHours(monthlyReport.workedHours)}</div></CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Earnings/Hour</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMoney(avgHourly)}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Cashflow</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => [`£${value}`, 'Amount']} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]} className="fill-emerald-500 [&:nth-child(2)]:fill-red-500" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Cash Flow Overview</CardTitle>
            <CardDescription>Monthly comparison of earnings vs expenses</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {loading ? (
               <div className="h-[300px] flex items-center justify-center text-zinc-500 animate-pulse">Loading chart data...</div>
            ) : chartData.length === 0 ? (
               <div className="h-[300px] flex items-center justify-center text-zinc-500">No data available yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `£${value}`} />
                  <Tooltip formatter={(value) => [`£${value}`, 'Income']} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-zinc-500">No income data for this month.</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Expenses Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center">
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {catData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`£${value}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full text-center text-zinc-500">No expenses recorded for this month.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
