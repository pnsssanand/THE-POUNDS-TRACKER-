import { o as __toESM } from "../_runtime.mjs";
import { n as getSettings, s as updateSettings } from "./authService-Bu2b5XPT.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { n as CheckboxIndicator, p as require_jsx_runtime, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useAuth } from "./AuthContext-QdaOKkmJ.mjs";
import { a as formatMoney, r as formatDateUK } from "./format-BgBAw96h.mjs";
import { i as getExpenses, n as addExpense, o as updateExpense, r as deleteExpense, t as EXPENSE_CATEGORIES } from "./expenseService-7IbBkoOG.mjs";
import { l as calculateTotalExpenses, o as calculateMonthlyExpenses, r as calculateDailyExpenses } from "./calc-DutBGfy3.mjs";
import { c as cn, n as Card, o as CardHeader, r as CardContent, s as CardTitle, t as Button } from "./button-TSKh01qk.mjs";
import { n as Label, t as Input } from "./label-CM5v66cH.mjs";
import { O as Check, d as RefreshCw, g as Pen, l as Search, m as Plus, s as Trash, x as Funnel } from "../_libs/lucide-react.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-D2KfAh-D.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BTEU47zT.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-jKrlgwJV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/expenses-BRtxLCPT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
function ExpensesPage() {
	const { user } = useAuth();
	const uid = user?.uid;
	const [expenses, setExpenses] = (0, import_react.useState)([]);
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [categoryFilter, setCategoryFilter] = (0, import_react.useState)("all");
	const [isDialogOpen, setIsDialogOpen] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [purpose, setPurpose] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [category, setCategory] = (0, import_react.useState)("Other");
	const [paymentMode, setPaymentMode] = (0, import_react.useState)("cash");
	const [bankName, setBankName] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [savePreferred, setSavePreferred] = (0, import_react.useState)(false);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
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
	(0, import_react.useEffect)(() => {
		if (!uid) return;
		getSettings(uid).then((s) => {
			setSettings(s);
			if (s) {
				setPaymentMode(s.preferredPaymentMode);
				if (s.preferredBank) setBankName(s.preferredBank);
			}
		});
		loadData();
	}, [uid]);
	const handleEdit = (expense) => {
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
	const handleSubmit = async (e) => {
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
				bankName: paymentMode === "card" ? bankName : void 0,
				notes
			};
			if (editingId) await updateExpense(uid, editingId, input);
			else await addExpense(uid, input);
			if (savePreferred) await updateSettings(uid, {
				preferredPaymentMode: paymentMode,
				...paymentMode === "card" ? { preferredBank: bankName } : {}
			});
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
		setDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
		setCategory("Other");
		setPaymentMode(settings?.preferredPaymentMode || "cash");
		setBankName(settings?.preferredBank || "");
		setNotes("");
		setSavePreferred(false);
	};
	const handleDelete = async (id) => {
		if (!uid) return;
		if (confirm("Are you sure you want to delete this expense?")) {
			await deleteExpense(uid, id);
			loadData();
		}
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-pulse text-zinc-500",
			children: "Loading expenses..."
		})
	});
	const todayTotal = calculateDailyExpenses(expenses);
	const monthTotal = calculateMonthlyExpenses(expenses);
	const absoluteTotal = calculateTotalExpenses(expenses);
	const filteredExpenses = expenses.filter((e) => {
		const matchesSearch = e.purpose.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
		return matchesSearch && matchesCategory;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold tracking-tight",
					children: "Expenses"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-zinc-500 mt-1",
					children: "Track and manage your spending."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 w-full sm:w-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						onClick: loadData,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-4 h-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
						open: isDialogOpen,
						onOpenChange: (open) => {
							setIsDialogOpen(open);
							if (!open) resetForm();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "flex-1 sm:flex-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-2" }), " Add Expense"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
							className: "sm:max-w-[425px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleSubmit,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingId ? "Edit Expense" : "Add New Expense" }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-4 py-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "purpose",
													children: "Purpose"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "purpose",
													value: purpose,
													onChange: (e) => setPurpose(e.target.value),
													required: true,
													placeholder: "e.g. Lunch with client"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "amount",
														children: "Amount (£)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "amount",
														type: "number",
														step: "0.01",
														min: "0",
														value: amount,
														onChange: (e) => setAmount(e.target.value),
														required: true,
														placeholder: "0.00"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "date",
														children: "Date"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "date",
														type: "date",
														value: date,
														onChange: (e) => setDate(e.target.value),
														required: true
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "category",
													children: "Category"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
													value: category,
													onValueChange: (v) => setCategory(v),
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select category" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: EXPENSE_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: c,
														children: c
													}, c)) })]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "paymentMode",
														children: "Payment Method"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
														value: paymentMode,
														onValueChange: (v) => setPaymentMode(v),
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select method" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: "cash",
															children: "Cash"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: "card",
															children: "Card"
														})] })]
													})]
												}), paymentMode === "card" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
														htmlFor: "bankName",
														children: "Bank Name"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														id: "bankName",
														value: bankName,
														onChange: (e) => setBankName(e.target.value),
														placeholder: "e.g. Monzo",
														required: true
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "notes",
													children: "Notes (Optional)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "notes",
													value: notes,
													onChange: (e) => setNotes(e.target.value),
													placeholder: "Any extra details..."
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center space-x-2 mt-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
													id: "savePreferred",
													checked: savePreferred,
													onCheckedChange: (c) => setSavePreferred(c)
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "savePreferred",
													className: "text-sm font-normal text-zinc-600",
													children: "Set as my preferred payment method"
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "button",
										variant: "outline",
										onClick: () => setIsDialogOpen(false),
										children: "Cancel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										type: "submit",
										disabled: isSubmitting,
										children: isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Save Expense"
									})] })
								]
							})
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Today's Expenses"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: formatMoney(todayTotal)
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "This Month's Expenses"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: formatMoney(monthTotal)
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "flex flex-row items-center justify-between space-y-0 pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Total Expenses"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: formatMoney(absoluteTotal)
						}) })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
					className: "border-b border-zinc-100 dark:border-zinc-800 pb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Expense History" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									placeholder: "Search expenses...",
									className: "pl-9 w-full sm:w-[250px]",
									value: searchTerm,
									onChange: (e) => setSearchTerm(e.target.value)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
								value: categoryFilter,
								onValueChange: setCategoryFilter,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger, {
									className: "w-[140px]",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "w-4 h-4 mr-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Category" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: "all",
									children: "All Categories"
								}), EXPENSE_CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
									value: c,
									children: c
								}, c))] })]
							})]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: filteredExpenses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-12 text-zinc-500",
						children: "No expenses found."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Purpose" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Category" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Method" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right",
								children: "Amount"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "w-[50px]" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filteredExpenses.map((expense) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-medium whitespace-nowrap",
								children: formatDateUK(expense.date)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: expense.purpose }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200",
								children: expense.category
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
								className: "capitalize text-zinc-500",
								children: [
									expense.paymentMode,
									" ",
									expense.paymentMode === "card" && expense.bankName ? `(${expense.bankName})` : ""
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right font-bold",
								children: formatMoney(expense.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
								className: "text-right whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleEdit(expense),
									className: "text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 mr-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-4 w-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleDelete(expense.id),
									className: "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash, { className: "h-4 w-4" })
								})]
							})
						] }, expense.id)) })] })
					})
				})]
			})
		]
	});
}
//#endregion
export { ExpensesPage as component };
