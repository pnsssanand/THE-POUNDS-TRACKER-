import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useAuth } from "./AuthContext-QdaOKkmJ.mjs";
import { a as formatMoney, r as formatDateUK } from "./format-BgBAw96h.mjs";
import { c as cn, n as Card, r as CardContent, t as Button } from "./button-TSKh01qk.mjs";
import { n as Label, t as Input } from "./label-CM5v66cH.mjs";
import { C as Clock, O as Check, d as RefreshCw, g as Pen, m as Plus, s as Trash, w as CircleCheck } from "../_libs/lucide-react.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-D2KfAh-D.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BTEU47zT.mjs";
import { a as getIncomingPayments, i as deleteUpcomingPayment, l as updateIncomingPayment, n as addUpcomingPayment, o as getUpcomingPayments, r as deleteIncomingPayment, t as addIncomingPayment, u as updateUpcomingPayment } from "./paymentService-DXvHSJe9.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payments-m2sc2Ndl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
function PaymentsPage() {
	const { user } = useAuth();
	const uid = user?.uid;
	const [upcoming, setUpcoming] = (0, import_react.useState)([]);
	const [incoming, setIncoming] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const loadData = async () => {
		if (!uid) return;
		setLoading(true);
		try {
			const [upData, inData] = await Promise.all([getUpcomingPayments(uid), getIncomingPayments(uid)]);
			setUpcoming(upData);
			setIncoming(inData);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadData();
	}, [uid]);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-pulse text-zinc-500",
			children: "Loading payments..."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex justify-between items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-3xl font-bold tracking-tight",
				children: "Payments"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-zinc-500 mt-1",
				children: "Manage your upcoming bills and expected income."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "outline",
				size: "icon",
				onClick: loadData,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-4 h-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
			defaultValue: "upcoming",
			className: "w-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
					className: "grid w-full max-w-md grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "upcoming",
						children: "Upcoming Payments"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
						value: "incoming",
						children: "Expected Income"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "upcoming",
					className: "mt-6 space-y-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpcomingSection, {
						uid,
						upcoming,
						reload: loadData
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
					value: "incoming",
					className: "mt-6 space-y-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IncomingSection, {
						uid,
						incoming,
						reload: loadData
					})
				})
			]
		})]
	});
}
function UpcomingSection({ uid, upcoming, reload }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [dueDate, setDueDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [category, setCategory] = (0, import_react.useState)("Bill");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const pending = upcoming.filter((p) => p.status === "pending").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
	const paid = upcoming.filter((p) => p.status === "paid").sort((a, b) => b.dueDate.localeCompare(a.dueDate));
	const resetForm = () => {
		setEditingId(null);
		setName("");
		setAmount("");
		setDueDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
		setCategory("Bill");
		setNotes("");
	};
	const handleEdit = (p) => {
		setEditingId(p.id);
		setName(p.payerName);
		setAmount(p.amount.toString());
		setDueDate(p.dueDate);
		setCategory(p.category);
		setNotes(p.notes || "");
		setIsOpen(true);
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!uid) return;
		setIsSubmitting(true);
		try {
			const input = {
				payerName: name,
				amount: parseFloat(amount),
				dueDate,
				category,
				status: "pending",
				notes
			};
			if (editingId) await updateUpcomingPayment(uid, editingId, input);
			else await addUpcomingPayment(uid, input);
			setIsOpen(false);
			resetForm();
			reload();
		} catch (e) {
			console.error(e);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleMarkPaid = async (id) => {
		if (!uid) return;
		await updateUpcomingPayment(uid, id, { status: "paid" });
		reload();
	};
	const handleDelete = async (id) => {
		if (!uid) return;
		if (confirm("Delete this payment?")) {
			await deleteUpcomingPayment(uid, id);
			reload();
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold",
					children: "Bills to Pay"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open: isOpen,
					onOpenChange: (o) => {
						setIsOpen(o);
						if (!o) resetForm();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-2" }), " Add Bill"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingId ? "Edit Bill" : "Add Upcoming Payment" }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Payment Name (e.g. Rent)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: name,
											onChange: (e) => setName(e.target.value),
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (£)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												step: "0.01",
												value: amount,
												onChange: (e) => setAmount(e.target.value),
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Due Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "date",
												value: dueDate,
												onChange: (e) => setDueDate(e.target.value),
												required: true
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Category" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: category,
											onValueChange: setCategory,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Bill",
													children: "Bill"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Subscription",
													children: "Subscription"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Rent",
													children: "Rent"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: "Other",
													children: "Other"
												})
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Notes" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: notes,
											onChange: (e) => setNotes(e.target.value)
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: isSubmitting,
								children: "Save"
							})] })
						]
					}) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [pending.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "shadow-sm border-l-4 border-l-orange-500",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-bold text-lg",
									children: p.payerName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center text-sm text-zinc-500 mt-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-4 h-4 mr-1" }),
										" Due: ",
										formatDateUK(p.dueDate)
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-block mt-2 text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md",
									children: p.category
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xl font-bold text-red-600",
									children: formatMoney(p.amount)
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex justify-end gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => handleEdit(p),
									className: "text-blue-500",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "w-4 h-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => handleDelete(p.id),
									className: "text-red-500",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash, { className: "w-4 h-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => handleMarkPaid(p.id),
									className: "text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4 mr-1" }), " Mark Paid"]
								})
							]
						})]
					})
				}, p.id)), pending.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "col-span-2 text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800",
					children: "No upcoming bills. You're all caught up!"
				})]
			}),
			paid.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-medium text-zinc-500 mb-4",
					children: "Recently Paid"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: paid.slice(0, 5).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-5 h-5 text-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-sm line-through",
								children: p.payerName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-zinc-500",
								children: ["Was due ", formatDateUK(p.dueDate)]
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: formatMoney(p.amount)
						})]
					}, p.id))
				})]
			})
		]
	});
}
function IncomingSection({ uid, incoming, reload }) {
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [payer, setPayer] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [expectedDate, setExpectedDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [notes, setNotes] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const expected = incoming.filter((p) => p.status === "expected").sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
	const received = incoming.filter((p) => p.status === "received").sort((a, b) => b.expectedDate.localeCompare(a.expectedDate));
	const resetForm = () => {
		setEditingId(null);
		setPayer("");
		setAmount("");
		setExpectedDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
		setNotes("");
	};
	const handleEdit = (p) => {
		setEditingId(p.id);
		setPayer(p.payerName);
		setAmount(p.amount.toString());
		setExpectedDate(p.expectedDate);
		setNotes(p.notes || "");
		setIsOpen(true);
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!uid) return;
		setIsSubmitting(true);
		try {
			const input = {
				payerName: payer,
				amount: parseFloat(amount),
				expectedDate,
				status: "expected",
				notes
			};
			if (editingId) await updateIncomingPayment(uid, editingId, input);
			else await addIncomingPayment(uid, input);
			setIsOpen(false);
			resetForm();
			reload();
		} catch (e) {
			console.error(e);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleMarkReceived = async (id) => {
		if (!uid) return;
		await updateIncomingPayment(uid, id, { status: "received" });
		reload();
	};
	const handleDelete = async (id) => {
		if (!uid) return;
		if (confirm("Delete this incoming payment?")) {
			await deleteIncomingPayment(uid, id);
			reload();
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-semibold",
					children: "Expected Income"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open: isOpen,
					onOpenChange: (o) => {
						setIsOpen(o);
						if (!o) resetForm();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-2" }), " Add Income"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingId ? "Edit Expected Income" : "Add Expected Income" }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid gap-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Source / Payer Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: payer,
											onChange: (e) => setPayer(e.target.value),
											required: true
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (£)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "number",
												step: "0.01",
												value: amount,
												onChange: (e) => setAmount(e.target.value),
												required: true
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Expected Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												type: "date",
												value: expectedDate,
												onChange: (e) => setExpectedDate(e.target.value),
												required: true
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Notes" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: notes,
											onChange: (e) => setNotes(e.target.value)
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								onClick: () => setIsOpen(false),
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								disabled: isSubmitting,
								children: "Save"
							})] })
						]
					}) })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2",
				children: [expected.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "shadow-sm border-l-4 border-l-blue-500",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-lg",
								children: p.payerName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center text-sm text-zinc-500 mt-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-4 h-4 mr-1" }),
									" Expected: ",
									formatDateUK(p.expectedDate)
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-right",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xl font-bold text-emerald-600",
									children: formatMoney(p.amount)
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex justify-end gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => handleEdit(p),
									className: "text-blue-500",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "w-4 h-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "sm",
									onClick: () => handleDelete(p.id),
									className: "text-red-500",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash, { className: "w-4 h-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									size: "sm",
									variant: "outline",
									onClick: () => handleMarkReceived(p.id),
									className: "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4 mr-1" }), " Mark Received"]
								})
							]
						})]
					})
				}, p.id)), expected.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "col-span-2 text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800",
					children: "No expected income."
				})]
			}),
			received.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-lg font-medium text-zinc-500 mb-4",
					children: "Recently Received"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-3",
					children: received.slice(0, 5).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-100 dark:border-zinc-800 opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-5 h-5 text-blue-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-medium text-sm line-through",
								children: p.payerName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-zinc-500",
								children: ["Expected ", formatDateUK(p.expectedDate)]
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: formatMoney(p.amount)
						})]
					}, p.id))
				})]
			})
		]
	});
}
//#endregion
export { PaymentsPage as component };
