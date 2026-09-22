import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { monthStatus, generateMotivation } from "../lib/calc";
import { formatMoney } from "../lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { PoundSterling, TrendingUp, TrendingDown, Clock, PiggyBank, Calendar, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, firebaseError } = useAuth();
  
  if (firebaseError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="w-full max-w-2xl space-y-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-red-600">
            Firebase Not Configured
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            The application is missing Firebase credentials. Please add your VITE_FIREBASE_API_KEY and other configuration variables to your .env file to continue.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
              <span className="text-emerald-500">£</span> PoundsTracker
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-zinc-600 dark:text-zinc-400">
              The smartest way to manage your finances. Create an account today or log in to continue.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8">
                  Sign in
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8">
                  Create account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} />;
}

function Dashboard({ user }: { user: any }) {
  const { summary, settings, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading your dashboard...</div>
      </div>
    );
  }

  const hourMotivation = generateMotivation({
    currentHours: summary.monthlyHours,
    targetHours: settings?.monthlyHoursTarget || 0,
    currentEarnings: summary.monthlyEarnings,
    targetEarnings: settings?.monthlyEarningsTarget || 0,
    daysRemaining: 30 - new Date().getDate(), // rough estimate
  });

  const chartData = [
    { name: "Income", amount: summary.monthlyEarnings },
    { name: "Expenses", amount: summary.monthlyExpenses },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
            <span className="text-emerald-600 dark:text-emerald-400">{user.displayName?.split(' ')[0] || user.username || "User"}</span>
          </h1>
          <p className="text-lg text-zinc-500 mt-1">{monthStatus(summary.monthlyBalance)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(summary.monthlyEarnings)}</div>
            <p className="text-xs text-zinc-500 mt-1">
              +{formatMoney(summary.todayEarnings)} today
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(summary.monthlyExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.monthlyBalance >= 0 ? "text-zinc-900 dark:text-zinc-50" : "text-red-600 dark:text-red-400"}`}>
              {formatMoney(summary.monthlyBalance)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Projected: {formatMoney(summary.projectedBalance)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(summary.totalSavings)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Your cashflow this month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(value) => `£${value}`}
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  formatter={(value) => [`£${value}`, 'Amount']}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 0, 0]}
                  fill="currentColor"
                  className="fill-emerald-500 [&:nth-child(2)]:fill-red-500"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Goals</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-medium">Working Hours</span>
                </div>
                <span className="text-sm text-zinc-500">
                  {summary.monthlyHours.toFixed(1)} / {settings?.monthlyHoursTarget || 0} hrs
                </span>
              </div>
              <Progress value={hourMotivation.percent} className="h-2" />
              <p className="text-xs text-zinc-500">{hourMotivation.message}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PoundSterling className="h-4 w-4 text-zinc-500" />
                  <span className="text-sm font-medium">Earnings Target</span>
                </div>
                <span className="text-sm text-zinc-500">
                  {formatMoney(summary.monthlyEarnings)} / {formatMoney(settings?.monthlyEarningsTarget || 0)}
                </span>
              </div>
              <Progress 
                value={settings?.monthlyEarningsTarget ? (summary.monthlyEarnings / settings.monthlyEarningsTarget) * 100 : 0} 
                className="h-2" 
              />
            </div>
            
            {hourMotivation.state === "achieved" && (
               <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-4 border border-emerald-200 dark:border-emerald-500/20">
                 <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">TARGET ACHIEVED!</h4>
                 <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Incredible work this month. You've hit your goals.</p>
               </div>
            )}
            
            {hourMotivation.state === "exceeded" && (
               <div className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-4 border border-indigo-200 dark:border-indigo-500/20">
                 <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">TARGET EXCEEDED!</h4>
                 <p className="text-xs text-indigo-600 dark:text-indigo-500 mt-1">You've gone above and beyond. Outstanding.</p>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
