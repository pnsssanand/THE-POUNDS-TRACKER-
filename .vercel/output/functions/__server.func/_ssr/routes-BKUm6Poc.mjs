import { o as __toESM } from "../_runtime.mjs";
import { n as getSettings } from "./authService-Bu2b5XPT.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useAuth } from "./AuthContext-QdaOKkmJ.mjs";
import { a as formatMoney } from "./format-BgBAw96h.mjs";
import { a as subscribeExpenses } from "./expenseService-7IbBkoOG.mjs";
import { a as calculateMonthlyBalance, c as calculateProjectedBalance, d as calculateWorkingHours, h as monthStatus, i as calculateDailyIncome, m as generateMotivation, o as calculateMonthlyExpenses, s as calculateMonthlyIncome, u as calculateTotalSavings } from "./calc-DutBGfy3.mjs";
import { c as cn, i as CardDescription, n as Card, o as CardHeader, r as CardContent, s as CardTitle, t as Button } from "./button-TSKh01qk.mjs";
import { C as Clock, a as TrendingUp, h as PiggyBank, n as Wallet, o as TrendingDown, p as PoundSterling } from "../_libs/lucide-react.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as subscribeUpcomingPayments, s as subscribeIncomingPayments } from "./paymentService-DXvHSJe9.mjs";
import { i as subscribeWorkSessions } from "./workService-DoEVqiaT.mjs";
import { a as XAxis, c as CartesianGrid, d as Tooltip, i as YAxis, n as BarChart, o as Bar, p as ResponsiveContainer } from "../_libs/recharts+[...].mjs";
import { i as subscribeSavings } from "./savingsService-otpeLm6n.mjs";
import { n as Root, t as Indicator } from "../_libs/radix-ui__react-progress.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BKUm6Poc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useDashboardData() {
	const { user } = useAuth();
	const uid = user?.uid;
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [sessions, setSessions] = (0, import_react.useState)([]);
	const [expenses, setExpenses] = (0, import_react.useState)([]);
	const [savings, setSavings] = (0, import_react.useState)([]);
	const [upcoming, setUpcoming] = (0, import_react.useState)([]);
	const [incoming, setIncoming] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!uid) return;
		let mounted = true;
		getSettings(uid).then((s) => {
			if (mounted) setSettings(s);
		}).catch((e) => {
			console.error("Failed to fetch settings", e);
		});
		const unsubSessions = subscribeWorkSessions(uid, setSessions, setError);
		const unsubExpenses = subscribeExpenses(uid, setExpenses, setError);
		const unsubSavings = subscribeSavings(uid, setSavings, setError);
		const unsubUpcoming = subscribeUpcomingPayments(uid, setUpcoming, setError);
		const unsubIncoming = subscribeIncomingPayments(uid, setIncoming, setError);
		setLoading(false);
		return () => {
			mounted = false;
			unsubSessions();
			unsubExpenses();
			unsubSavings();
			unsubUpcoming();
			unsubIncoming();
		};
	}, [uid]);
	const todayEarnings = calculateDailyIncome(sessions);
	const monthlyEarnings = calculateMonthlyIncome(sessions);
	const monthlyExpenses = calculateMonthlyExpenses(expenses);
	const monthlyBalance = calculateMonthlyBalance(sessions, expenses);
	const monthlyHours = calculateWorkingHours(sessions);
	const totalSavings = calculateTotalSavings(savings);
	const actualBalance = monthlyEarnings - monthlyExpenses;
	return {
		loading,
		error,
		settings,
		sessions,
		expenses,
		summary: {
			todayEarnings,
			monthlyEarnings,
			monthlyExpenses,
			monthlyBalance,
			monthlyHours,
			totalSavings,
			projectedBalance: calculateProjectedBalance(actualBalance, incoming, upcoming)
		}
	};
}
var Progress = import_react.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = Root.displayName;
function Index() {
	const { user, firebaseError } = useAuth();
	if (firebaseError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-2xl space-y-6 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-4xl font-extrabold tracking-tight sm:text-5xl text-red-600",
				children: "Firebase Not Configured"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto max-w-xl text-lg text-zinc-600 dark:text-zinc-400",
				children: "The application is missing Firebase credentials. Please add your VITE_FIREBASE_API_KEY and other configuration variables to your .env file to continue."
			})]
		})
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-full max-w-3xl space-y-8 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "text-5xl font-extrabold tracking-tight sm:text-7xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-emerald-500",
							children: "£"
						}), " PoundsTracker"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-auto max-w-2xl text-xl text-zinc-600 dark:text-zinc-400",
						children: "The smartest way to manage your finances. Create an account today or log in to continue."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center justify-center gap-4 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "lg",
								className: "w-full sm:w-auto h-12 px-8",
								children: "Sign in"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/signup",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "lg",
								variant: "outline",
								className: "w-full sm:w-auto h-12 px-8",
								children: "Create account"
							})
						})]
					})
				]
			})
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dashboard, { user });
}
function Dashboard({ user }) {
	const { summary, settings, loading } = useDashboardData();
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-pulse text-zinc-500",
			children: "Loading your dashboard..."
		})
	});
	const hourMotivation = generateMotivation({
		currentHours: summary.monthlyHours,
		targetHours: settings?.monthlyHoursTarget || 0,
		currentEarnings: summary.monthlyEarnings,
		targetEarnings: settings?.monthlyEarningsTarget || 0,
		daysRemaining: 30 - (/* @__PURE__ */ new Date()).getDate()
	});
	const chartData = [{
		name: "Income",
		amount: summary.monthlyEarnings
	}, {
		name: "Expenses",
		amount: summary.monthlyExpenses
	}];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col md:flex-row justify-between items-start md:items-end gap-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-3xl font-bold tracking-tight",
					children: [
						"Good ",
						(/* @__PURE__ */ new Date()).getHours() < 12 ? "morning" : (/* @__PURE__ */ new Date()).getHours() < 18 ? "afternoon" : "evening",
						",",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-emerald-600 dark:text-emerald-400",
							children: user.displayName?.split(" ")[0] || user.username || "User"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-lg text-zinc-500 mt-1",
					children: monthStatus(summary.monthlyBalance)
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Monthly Earnings"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-4 w-4 text-emerald-500" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: formatMoney(summary.monthlyEarnings)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-zinc-500 mt-1",
							children: [
								"+",
								formatMoney(summary.todayEarnings),
								" today"
							]
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Monthly Expenses"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "h-4 w-4 text-red-500" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: formatMoney(summary.monthlyExpenses)
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Current Balance"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-4 w-4 text-blue-500" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `text-2xl font-bold ${summary.monthlyBalance >= 0 ? "text-zinc-900 dark:text-zinc-50" : "text-red-600 dark:text-red-400"}`,
							children: formatMoney(summary.monthlyBalance)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-zinc-500 mt-1",
							children: ["Projected: ", formatMoney(summary.projectedBalance)]
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Total Savings"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PiggyBank, { className: "h-4 w-4 text-purple-500" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: formatMoney(summary.totalSavings)
						}) })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2 lg:grid-cols-7",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "col-span-full lg:col-span-4 shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Income vs Expenses" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Your cashflow this month" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "h-[300px]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
								data: chartData,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										strokeDasharray: "3 3",
										vertical: false,
										opacity: .3
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "name",
										axisLine: false,
										tickLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										axisLine: false,
										tickLine: false,
										tickFormatter: (value) => `£${value}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
										cursor: { fill: "transparent" },
										formatter: (value) => [`£${value}`, "Amount"],
										contentStyle: {
											borderRadius: "8px",
											border: "none",
											boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "amount",
										radius: [
											4,
											4,
											0,
											0
										],
										fill: "currentColor",
										className: "fill-emerald-500 [&:nth-child(2)]:fill-red-500"
									})
								]
							})
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "col-span-full lg:col-span-3 shadow-sm flex flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Monthly Goals" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Track your progress" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "flex-1 space-y-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "h-4 w-4 text-zinc-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-medium",
												children: "Working Hours"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-sm text-zinc-500",
											children: [
												summary.monthlyHours.toFixed(1),
												" / ",
												settings?.monthlyHoursTarget || 0,
												" hrs"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
										value: hourMotivation.percent,
										className: "h-2"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-zinc-500",
										children: hourMotivation.message
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PoundSterling, { className: "h-4 w-4 text-zinc-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-medium",
											children: "Earnings Target"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm text-zinc-500",
										children: [
											formatMoney(summary.monthlyEarnings),
											" / ",
											formatMoney(settings?.monthlyEarningsTarget || 0)
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
									value: settings?.monthlyEarningsTarget ? summary.monthlyEarnings / settings.monthlyEarningsTarget * 100 : 0,
									className: "h-2"
								})]
							}),
							hourMotivation.state === "achieved" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-4 border border-emerald-200 dark:border-emerald-500/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-bold text-emerald-700 dark:text-emerald-400",
									children: "TARGET ACHIEVED!"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-emerald-600 dark:text-emerald-500 mt-1",
									children: "Incredible work this month. You've hit your goals."
								})]
							}),
							hourMotivation.state === "exceeded" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-4 border border-indigo-200 dark:border-indigo-500/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-bold text-indigo-700 dark:text-indigo-400",
									children: "TARGET EXCEEDED!"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-indigo-600 dark:text-indigo-500 mt-1",
									children: "You've gone above and beyond. Outstanding."
								})]
							})
						]
					})]
				})]
			})
		]
	});
}
//#endregion
export { Index as component };
