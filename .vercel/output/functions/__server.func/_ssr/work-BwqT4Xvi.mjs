import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useAuth } from "./AuthContext-QdaOKkmJ.mjs";
import { a as formatMoney, i as formatHours, r as formatDateUK } from "./format-BgBAw96h.mjs";
import { n as Card, o as CardHeader, r as CardContent, s as CardTitle, t as Button } from "./button-TSKh01qk.mjs";
import { n as Label, t as Input } from "./label-CM5v66cH.mjs";
import { d as RefreshCw, g as Pen, l as Search, m as Plus, s as Trash } from "../_libs/lucide-react.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-D2KfAh-D.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-jKrlgwJV.mjs";
import { a as updateWorkSession, n as deleteWorkSession, r as getWorkSessions, t as addWorkSession } from "./workService-DoEVqiaT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/work-BwqT4Xvi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WorkPage() {
	const { user } = useAuth();
	const uid = user?.uid;
	const [sessions, setSessions] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [companyName, setCompanyName] = (0, import_react.useState)("");
	const [workDate, setWorkDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [checkIn, setCheckIn] = (0, import_react.useState)("09:00");
	const [checkOut, setCheckOut] = (0, import_react.useState)("17:00");
	const [breakMinutes, setBreakMinutes] = (0, import_react.useState)("0");
	const [hourlyRate, setHourlyRate] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const loadData = async () => {
		if (!uid) return;
		setLoading(true);
		try {
			const data = await getWorkSessions(uid);
			setSessions(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadData();
	}, [uid]);
	const resetForm = () => {
		setEditingId(null);
		setCompanyName("");
		setWorkDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
		setCheckIn("09:00");
		setCheckOut("17:00");
		setBreakMinutes("0");
		setHourlyRate("");
		setNotes("");
	};
	const handleEdit = (s) => {
		setEditingId(s.id);
		setCompanyName(s.companyName);
		setWorkDate(s.workDate);
		setCheckIn(s.checkIn);
		setCheckOut(s.checkOut);
		setBreakMinutes(s.breakMinutes.toString());
		setHourlyRate(s.hourlyRate.toString());
		setNotes(s.notes || "");
		setIsOpen(true);
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!uid) return;
		setIsSubmitting(true);
		try {
			const input = {
				companyName,
				workDate,
				checkIn,
				checkOut,
				breakMinutes: parseInt(breakMinutes) || 0,
				hourlyRate: parseFloat(hourlyRate) || 0,
				notes
			};
			if (editingId) await updateWorkSession(uid, editingId, input);
			else await addWorkSession(uid, input);
			setIsOpen(false);
			resetForm();
			loadData();
		} catch (err) {
			console.error(err);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleDelete = async (id) => {
		if (!uid) return;
		if (confirm("Delete this work session?")) {
			await deleteWorkSession(uid, id);
			loadData();
		}
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-pulse text-zinc-500",
			children: "Loading work sessions..."
		})
	});
	const filteredSessions = sessions.filter((s) => s.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
	const totalEarnings = sessions.reduce((acc, s) => acc + s.earnings, 0);
	const totalHours = sessions.reduce((acc, s) => acc + s.workedHours, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold tracking-tight",
					children: "Work & Earnings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-zinc-500 mt-1",
					children: "Log your shifts and track your income."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 w-full sm:w-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						onClick: loadData,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-4 h-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
						open: isOpen,
						onOpenChange: (o) => {
							setIsOpen(o);
							if (!o) resetForm();
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
							asChild: true,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "flex-1 sm:flex-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-2" }), " Add Shift"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
							className: "sm:max-w-[425px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleSubmit,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingId ? "Edit Work Session" : "Add Work Session" }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-4 py-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Company Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: companyName,
														onChange: (e) => setCompanyName(e.target.value),
														required: true
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "date",
														value: workDate,
														onChange: (e) => setWorkDate(e.target.value),
														required: true
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Check In" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "time",
														value: checkIn,
														onChange: (e) => setCheckIn(e.target.value),
														required: true
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Check Out" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "time",
														value: checkOut,
														onChange: (e) => setCheckOut(e.target.value),
														required: true
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Break (minutes)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														min: "0",
														value: breakMinutes,
														onChange: (e) => setBreakMinutes(e.target.value),
														required: true
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Hourly Rate (£)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														step: "0.01",
														min: "0",
														value: hourlyRate,
														onChange: (e) => setHourlyRate(e.target.value),
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
										children: editingId ? "Save Changes" : "Save Shift"
									})] })
								]
							})
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Total Shifts"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: sessions.length
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Total Hours"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold",
							children: formatHours(totalHours)
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium",
								children: "Total Earnings"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold text-emerald-600",
							children: formatMoney(totalEarnings)
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
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "History" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								placeholder: "Search company...",
								className: "pl-9 w-full sm:w-[250px]",
								value: searchTerm,
								onChange: (e) => setSearchTerm(e.target.value)
							})]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: filteredSessions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-12 text-zinc-500",
						children: "No work sessions found."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Date" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Company" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Hours" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Rate" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right",
								children: "Earnings"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { className: "w-[50px]" })
						] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: filteredSessions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "font-medium whitespace-nowrap",
								children: formatDateUK(s.workDate)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: s.companyName }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: formatHours(s.workedHours) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [formatMoney(s.hourlyRate), "/hr"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
								className: "text-right font-bold text-emerald-600",
								children: formatMoney(s.earnings)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
								className: "text-right",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleEdit(s),
									className: "text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 mr-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "h-4 w-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleDelete(s.id),
									className: "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash, { className: "h-4 w-4" })
								})]
							})
						] }, s.id)) })] })
					})
				})]
			})
		]
	});
}
//#endregion
export { WorkPage as component };
