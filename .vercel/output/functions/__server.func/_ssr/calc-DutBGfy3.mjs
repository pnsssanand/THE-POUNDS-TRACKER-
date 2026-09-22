import { l as todayISO, s as monthKey } from "./format-BgBAw96h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calc-DutBGfy3.js
/** Minutes worked, supporting overnight shifts. Never negative. */
function computeWorkedMinutes(checkIn, checkOut, breakMinutes) {
	const toMin = (t) => {
		const [h, m] = t.split(":").map(Number);
		return (h ?? 0) * 60 + (m ?? 0);
	};
	const start = toMin(checkIn);
	let end = toMin(checkOut);
	if (end <= start) end += 1440;
	return Math.max(0, end - start - Math.max(0, breakMinutes || 0));
}
function computeWorkSessionTotals(input) {
	const workedMinutes = computeWorkedMinutes(input.checkIn, input.checkOut, input.breakMinutes);
	const workedHours = workedMinutes / 60;
	return {
		workedMinutes,
		workedHours,
		earnings: Math.round(workedHours * (input.hourlyRate || 0) * 100) / 100
	};
}
var sum = (values) => values.reduce((a, b) => a + b, 0);
var calculateDailyIncome = (sessions, date = todayISO()) => sum(sessions.filter((s) => s.workDate === date).map((s) => s.earnings));
var calculateMonthlyIncome = (sessions, month = monthKey()) => sum(sessions.filter((s) => s.workDate.startsWith(month)).map((s) => s.earnings));
var calculateDailyExpenses = (expenses, date = todayISO()) => sum(expenses.filter((e) => e.date === date).map((e) => e.amount));
var calculateMonthlyExpenses = (expenses, month = monthKey()) => sum(expenses.filter((e) => e.date.startsWith(month)).map((e) => e.amount));
var calculateTotalExpenses = (expenses) => sum(expenses.map((e) => e.amount));
var calculateWorkingHours = (sessions, month = monthKey()) => sum(sessions.filter((s) => s.workDate.startsWith(month)).map((s) => s.workedHours));
var calculateMonthlyBalance = (sessions, expenses) => calculateMonthlyIncome(sessions) - calculateMonthlyExpenses(expenses);
function calculateTargetPercentage(current, target) {
	if (!target || target <= 0) return 0;
	return Math.round(current / target * 1e4) / 100;
}
function calculateProjectedBalance(actualBalance, incoming, upcoming) {
	const expected = sum(incoming.filter((i) => i.status === "expected").map((i) => i.amount));
	const due = sum(upcoming.filter((u) => u.status === "pending").map((u) => u.amount));
	return actualBalance + expected - due;
}
function calculateAverageHourlyEarning(sessions) {
	const hours = sum(sessions.map((s) => s.workedHours));
	if (hours <= 0) return 0;
	return sum(sessions.map((s) => s.earnings)) / hours;
}
var calculateTotalSavings = (savings) => sum(savings.map((s) => s.amount));
function buildDailyReports(sessions, expenses, from, to) {
	const map = /* @__PURE__ */ new Map();
	const touch = (date) => {
		let row = map.get(date);
		if (!row) {
			row = {
				date,
				income: 0,
				expenses: 0,
				net: 0
			};
			map.set(date, row);
		}
		return row;
	};
	sessions.filter((s) => s.workDate >= from && s.workDate <= to).forEach((s) => touch(s.workDate).income += s.earnings);
	expenses.filter((e) => e.date >= from && e.date <= to).forEach((e) => touch(e.date).expenses += e.amount);
	return [...map.values()].map((r) => ({
		...r,
		net: r.income - r.expenses
	})).sort((a, b) => a.date.localeCompare(b.date));
}
function buildMonthlyReport(sessions, expenses, month = monthKey()) {
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
		highestSpendingDay: sortedBySpend[0] ?? null
	};
}
function expensesByCategory(expenses) {
	const map = /* @__PURE__ */ new Map();
	expenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
	return [...map.entries()].map(([name, value]) => ({
		name,
		value
	})).sort((a, b) => b.value - a.value);
}
function generateMotivation(input) {
	const percent = calculateTargetPercentage(input.currentHours, input.targetHours);
	const remainingHours = Math.max(0, input.targetHours - input.currentHours);
	if (input.targetHours <= 0) return {
		headline: "Set your monthly target",
		message: "Add a monthly hours and earnings target to start tracking your progress.",
		percent: 0,
		state: "start"
	};
	if (percent > 100) return {
		headline: "Target exceeded",
		message: `You've exceeded your target by ${(input.currentHours - input.targetHours).toFixed(1)} hours.`,
		percent,
		state: "exceeded"
	};
	if (percent === 100) return {
		headline: "Target achieved",
		message: "Your monthly working-hours target is complete. Great consistency.",
		percent,
		state: "achieved"
	};
	if (percent >= 80) return {
		headline: "You're over 80%",
		message: `Only ${remainingHours.toFixed(1)} hours to reach your target. You've built serious momentum. Keep going!`,
		percent,
		state: "milestone"
	};
	if (percent >= 75) return {
		headline: "Almost at the milestone",
		message: "Just a little more. You're almost at the 80% milestone.",
		percent,
		state: "close"
	};
	if (percent >= 65) return {
		headline: "You're getting close",
		message: "You're getting close. Stay consistent.",
		percent,
		state: "close"
	};
	if (percent >= 45) return {
		headline: "Halfway there",
		message: "You're halfway there. Keep the momentum going.",
		percent,
		state: "progress"
	};
	if (percent >= 15) return {
		headline: "Building momentum",
		message: `You still have time this month — ${input.daysRemaining} days left. Plan a few focused shifts and keep moving.`,
		percent,
		state: "progress"
	};
	return {
		headline: "Just getting started",
		message: "You're just getting started. Every shift moves you closer.",
		percent,
		state: "start"
	};
}
function monthStatus(net) {
	if (net > 0) return "You're positive this month.";
	if (net < 0) return "You're negative this month.";
	return "You're balanced this month.";
}
//#endregion
export { calculateMonthlyBalance as a, calculateProjectedBalance as c, calculateWorkingHours as d, computeWorkSessionTotals as f, monthStatus as h, calculateDailyIncome as i, calculateTotalExpenses as l, generateMotivation as m, calculateAverageHourlyEarning as n, calculateMonthlyExpenses as o, expensesByCategory as p, calculateDailyExpenses as r, calculateMonthlyIncome as s, buildMonthlyReport as t, calculateTotalSavings as u };
