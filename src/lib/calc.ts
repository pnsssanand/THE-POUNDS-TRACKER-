import type {
  DailyReport,
  Expense,
  IncomingPayment,
  MonthlyReport,
  Saving,
  UpcomingPayment,
  WorkSession,
} from "@/types";
import { monthKey, startOfWeekISO, todayISO } from "./format";

/** Minutes worked, supporting overnight shifts. Never negative. */
export function computeWorkedMinutes(
  checkIn: string,
  checkOut: string,
  breakMinutes: number,
): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  const start = toMin(checkIn);
  let end = toMin(checkOut);
  if (end <= start) end += 24 * 60; // overnight shift
  return Math.max(0, end - start - Math.max(0, breakMinutes || 0));
}

export function computeWorkSessionTotals(input: {
  checkIn: string;
  checkOut: string;
  breakMinutes: number;
  hourlyRate: number;
}) {
  const workedMinutes = computeWorkedMinutes(input.checkIn, input.checkOut, input.breakMinutes);
  const workedHours = workedMinutes / 60;
  const earnings = Math.round(workedHours * (input.hourlyRate || 0) * 100) / 100;
  return { workedMinutes, workedHours, earnings };
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const calculateDailyIncome = (sessions: WorkSession[], date = todayISO()) =>
  sum(sessions.filter((s) => s.workDate === date).map((s) => s.earnings));

export const calculateMonthlyIncome = (sessions: WorkSession[], month = monthKey()) =>
  sum(sessions.filter((s) => s.workDate.startsWith(month)).map((s) => s.earnings));

export const calculateDailyExpenses = (expenses: Expense[], date = todayISO()) =>
  sum(expenses.filter((e) => e.date === date).map((e) => e.amount));

export const calculateMonthlyExpenses = (expenses: Expense[], month = monthKey()) =>
  sum(expenses.filter((e) => e.date.startsWith(month)).map((e) => e.amount));

export const calculateWeeklyIncome = (sessions: WorkSession[]) => {
  const from = startOfWeekISO();
  return sum(sessions.filter((s) => s.workDate >= from).map((s) => s.earnings));
};

export const calculateWeeklyExpenses = (expenses: Expense[]) => {
  const from = startOfWeekISO();
  return sum(expenses.filter((e) => e.date >= from).map((e) => e.amount));
};

export const calculateYearlyIncome = (sessions: WorkSession[]) => {
  const year = todayISO().slice(0, 4);
  return sum(sessions.filter((s) => s.workDate.startsWith(year)).map((s) => s.earnings));
};

export const calculateTotalIncome = (sessions: WorkSession[]) =>
  sum(sessions.map((s) => s.earnings));

export const calculateTotalExpenses = (expenses: Expense[]) => sum(expenses.map((e) => e.amount));

export const calculateWorkingHours = (sessions: WorkSession[], month = monthKey()) =>
  sum(sessions.filter((s) => s.workDate.startsWith(month)).map((s) => s.workedHours));

export const calculateMonthlyBalance = (sessions: WorkSession[], expenses: Expense[]) =>
  calculateMonthlyIncome(sessions) - calculateMonthlyExpenses(expenses);

export function calculateTargetPercentage(current: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.round((current / target) * 10000) / 100;
}

export function calculateProjectedBalance(
  actualBalance: number,
  incoming: IncomingPayment[],
  upcoming: UpcomingPayment[],
): number {
  const expected = sum(incoming.filter((i) => i.status === "expected").map((i) => i.amount));
  const due = sum(upcoming.filter((u) => u.status === "pending").map((u) => u.amount));
  return actualBalance + expected - due;
}

export function calculateAverageHourlyEarning(sessions: WorkSession[]): number {
  const hours = sum(sessions.map((s) => s.workedHours));
  if (hours <= 0) return 0;
  return sum(sessions.map((s) => s.earnings)) / hours;
}

export const calculateTotalSavings = (savings: Saving[]) => sum(savings.map((s) => s.amount));

export function buildDailyReports(
  sessions: WorkSession[],
  expenses: Expense[],
  from: string,
  to: string,
): DailyReport[] {
  const map = new Map<string, DailyReport>();
  const touch = (date: string) => {
    let row = map.get(date);
    if (!row) {
      row = { date, income: 0, expenses: 0, net: 0 };
      map.set(date, row);
    }
    return row;
  };
  sessions
    .filter((s) => s.workDate >= from && s.workDate <= to)
    .forEach((s) => (touch(s.workDate).income += s.earnings));
  expenses
    .filter((e) => e.date >= from && e.date <= to)
    .forEach((e) => (touch(e.date).expenses += e.amount));
  return [...map.values()]
    .map((r) => ({ ...r, net: r.income - r.expenses }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildMonthlyReport(
  sessions: WorkSession[],
  expenses: Expense[],
  month = monthKey(),
): MonthlyReport {
  const monthSessions = sessions.filter((s) => s.workDate.startsWith(month));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
  const daily = buildDailyReports(monthSessions, monthExpenses, `${month}-01`, `${month}-31`);
  const income = sum(monthSessions.map((s) => s.earnings));
  const expensesTotal = sum(monthExpenses.map((e) => e.amount));
  const days = daily.length || 1;
  const sortedByIncome = [...daily].sort((a, b) => b.income - a.income);
  const sortedBySpend = [...daily].sort((a, b) => b.expenses - a.expenses);
  return {
    month,
    income,
    expenses: expensesTotal,
    net: income - expensesTotal,
    workedHours: sum(monthSessions.map((s) => s.workedHours)),
    sessions: monthSessions.length,
    averageDailyIncome: income / days,
    averageDailyExpenses: expensesTotal / days,
    highestEarningDay: sortedByIncome[0] ?? null,
    highestSpendingDay: sortedBySpend[0] ?? null,
  };
}

export function expensesByCategory(expenses: Expense[]): { name: string; value: number }[] {
  const map = new Map<string, number>();
  expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export interface MotivationInput {
  currentHours: number;
  targetHours: number;
  currentEarnings: number;
  targetEarnings: number;
  daysRemaining: number;
}

export interface Motivation {
  headline: string;
  message: string;
  percent: number;
  state: "start" | "progress" | "close" | "milestone" | "achieved" | "exceeded";
}

export function generateMotivation(input: MotivationInput): Motivation {
  const percent = calculateTargetPercentage(input.currentHours, input.targetHours);
  const remainingHours = Math.max(0, input.targetHours - input.currentHours);

  if (input.targetHours <= 0) {
    return {
      headline: "Set your monthly target",
      message: "Add a monthly hours and earnings target to start tracking your progress.",
      percent: 0,
      state: "start",
    };
  }
  if (percent > 100) {
    return {
      headline: "Target exceeded",
      message: `You've exceeded your target by ${(input.currentHours - input.targetHours).toFixed(1)} hours.`,
      percent,
      state: "exceeded",
    };
  }
  if (percent === 100) {
    return {
      headline: "Target achieved",
      message: "Your monthly working-hours target is complete. Great consistency.",
      percent,
      state: "achieved",
    };
  }
  if (percent >= 80) {
    return {
      headline: "You're over 80%",
      message: `Only ${remainingHours.toFixed(1)} hours to reach your target. You've built serious momentum. Keep going!`,
      percent,
      state: "milestone",
    };
  }
  if (percent >= 75) {
    return {
      headline: "Almost at the milestone",
      message: "Just a little more. You're almost at the 80% milestone.",
      percent,
      state: "close",
    };
  }
  if (percent >= 65) {
    return {
      headline: "You're getting close",
      message: "You're getting close. Stay consistent.",
      percent,
      state: "close",
    };
  }
  if (percent >= 45) {
    return {
      headline: "Halfway there",
      message: "You're halfway there. Keep the momentum going.",
      percent,
      state: "progress",
    };
  }
  if (percent >= 15) {
    return {
      headline: "Building momentum",
      message: `You still have time this month — ${input.daysRemaining} days left. Plan a few focused shifts and keep moving.`,
      percent,
      state: "progress",
    };
  }
  return {
    headline: "Just getting started",
    message: "You're just getting started. Every shift moves you closer.",
    percent,
    state: "start",
  };
}

export function monthStatus(net: number): string {
  if (net > 0) return "You're positive this month.";
  if (net < 0) return "You're negative this month.";
  return "You're balanced this month.";
}
