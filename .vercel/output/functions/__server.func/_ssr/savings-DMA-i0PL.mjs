import { o as __toESM } from "../_runtime.mjs";
import { n as getSettings, s as updateSettings } from "./authService-Bu2b5XPT.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useAuth } from "./AuthContext-QdaOKkmJ.mjs";
import { a as formatMoney } from "./format-BgBAw96h.mjs";
import { u as calculateTotalSavings } from "./calc-DutBGfy3.mjs";
import { i as CardDescription, n as Card, o as CardHeader, r as CardContent, s as CardTitle, t as Button } from "./button-TSKh01qk.mjs";
import { n as Label, t as Input } from "./label-CM5v66cH.mjs";
import { _ as Lock, c as ShieldCheck, d as RefreshCw, g as Pen, m as Plus, n as Wallet, s as Trash, v as LockOpen } from "../_libs/lucide-react.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-D2KfAh-D.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BTEU47zT.mjs";
import { a as updateSaving, n as deleteSaving, r as getSavings, t as addSaving } from "./savingsService-otpeLm6n.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/savings-DMA-i0PL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Hash a savings PIN with SHA-256 and a per-user salt. Raw PIN is never stored. */
async function hashPin(uid, pin) {
	const data = new TextEncoder().encode(`poundstracker:${uid}:${pin}`);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function SavingsPage() {
	const { user } = useAuth();
	const uid = user?.uid;
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [savings, setSavings] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [unlocked, setUnlocked] = (0, import_react.useState)(false);
	const [pinInput, setPinInput] = (0, import_react.useState)("");
	const [pinConfirm, setPinConfirm] = (0, import_react.useState)("");
	const [errorMsg, setErrorMsg] = (0, import_react.useState)("");
	const [isOpen, setIsOpen] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [accountType, setAccountType] = (0, import_react.useState)("bank");
	const [accountName, setAccountName] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const loadData = async () => {
		if (!uid) return;
		try {
			const data = await getSavings(uid);
			setSavings(data);
		} catch (err) {
			console.error(err);
		}
	};
	(0, import_react.useEffect)(() => {
		if (!uid) return;
		getSettings(uid).then((s) => {
			setSettings(s);
			setLoading(false);
		});
		loadData();
	}, [uid]);
	const handleUnlock = async (e) => {
		e.preventDefault();
		if (!uid || !settings) return;
		if (!settings.savingsPinHash) {
			if (pinInput !== pinConfirm) {
				setErrorMsg("PINs do not match.");
				return;
			}
			if (pinInput.length < 4) {
				setErrorMsg("PIN must be at least 4 digits.");
				return;
			}
			const hashed = await hashPin(uid, pinInput);
			await updateSettings(uid, { savingsPinHash: hashed });
			setSettings({
				...settings,
				savingsPinHash: hashed
			});
			setUnlocked(true);
			setErrorMsg("");
		} else if (await hashPin(uid, pinInput) === settings.savingsPinHash) {
			setUnlocked(true);
			setErrorMsg("");
		} else {
			setErrorMsg("Incorrect PIN");
			setPinInput("");
		}
	};
	const resetForm = () => {
		setEditingId(null);
		setName("");
		setAccountType("bank");
		setAccountName("");
		setAmount("");
	};
	const handleEdit = (s) => {
		setEditingId(s.id);
		setName(s.name);
		setAccountType(s.accountType);
		setAccountName(s.accountName);
		setAmount(s.amount.toString());
		setIsOpen(true);
	};
	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!uid) return;
		setIsSubmitting(true);
		try {
			const input = {
				name,
				accountType,
				accountName,
				amount: parseFloat(amount)
			};
			if (editingId) await updateSaving(uid, editingId, input);
			else await addSaving(uid, input);
			setIsOpen(false);
			resetForm();
			loadData();
		} catch (e) {
			console.error(e);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleDelete = async (id) => {
		if (!uid) return;
		if (confirm("Delete this savings item?")) {
			await deleteSaving(uid, id);
			loadData();
		}
	};
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-pulse text-zinc-500",
			children: "Accessing secure vault..."
		})
	});
	if (!unlocked) {
		const isNew = !settings?.savingsPinHash;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-[80vh] items-center justify-center p-4",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "w-full max-w-md shadow-lg border-emerald-500/20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "text-center space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-6 h-6 text-emerald-600 dark:text-emerald-500" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: isNew ? "Create your Savings PIN" : "Unlock Savings Vault" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: isNew ? "Set up a 4-digit PIN to secure your savings data." : "Enter your 4-digit PIN to access your vault." })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleUnlock,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "PIN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								maxLength: 4,
								inputMode: "numeric",
								value: pinInput,
								onChange: (e) => {
									setPinInput(e.target.value);
									setErrorMsg("");
								},
								placeholder: "****",
								className: "text-center text-2xl tracking-widest",
								required: true
							})]
						}),
						isNew && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Confirm PIN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "password",
								maxLength: 4,
								inputMode: "numeric",
								value: pinConfirm,
								onChange: (e) => {
									setPinConfirm(e.target.value);
									setErrorMsg("");
								},
								placeholder: "****",
								className: "text-center text-2xl tracking-widest",
								required: true
							})]
						}),
						errorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-red-500 text-center font-medium",
							children: errorMsg
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full bg-emerald-600 hover:bg-emerald-700",
							children: isNew ? "Set PIN & Unlock" : "Unlock Vault"
						})
					]
				}) })]
			})
		});
	}
	const total = calculateTotalSavings(savings);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-3xl font-bold tracking-tight",
						children: "Savings Vault"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-6 h-6 text-emerald-500" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-zinc-500 mt-1",
					children: "Your secured savings overview."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 w-full sm:w-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "icon",
							onClick: loadData,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-4 h-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => setUnlocked(false),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-4 h-4 mr-2" }), " Lock"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
							open: isOpen,
							onOpenChange: (o) => {
								setIsOpen(o);
								if (!o) resetForm();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
								asChild: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-2" }), " Add Savings"] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleSubmit,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: editingId ? "Edit Savings" : "Add to Vault" }) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid gap-4 py-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Savings Name (e.g. Emergency Fund)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: name,
													onChange: (e) => setName(e.target.value),
													required: true
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Account Type" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
														value: accountType,
														onValueChange: (v) => setAccountType(v),
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: "bank",
															children: "Bank Account"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
															value: "cash",
															children: "Physical Cash"
														})] })]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: accountType === "bank" ? "Bank Name" : "Location" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: accountName,
														onChange: (e) => setAccountName(e.target.value),
														placeholder: accountType === "bank" ? "e.g. HSBC" : "e.g. Safe",
														required: true
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Amount (£)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													type: "number",
													step: "0.01",
													min: "0",
													value: amount,
													onChange: (e) => setAmount(e.target.value),
													required: true
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
										children: "Secure Save"
									})] })
								]
							}) })]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "bg-emerald-950 text-white border-none shadow-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "p-8 flex flex-col items-center justify-center text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockOpen, { className: "w-8 h-8 text-emerald-400 mb-4 opacity-50" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-emerald-200 font-medium mb-2 tracking-widest uppercase text-sm",
							children: "Total Secured Savings"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-5xl md:text-6xl font-extrabold tracking-tight",
							children: formatMoney(total)
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3",
				children: [savings.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "shadow-sm border-t-4 border-t-emerald-500",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-lg",
								children: s.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center text-sm text-zinc-500 mt-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "w-4 h-4 mr-1" }),
									" ",
									s.accountType === "bank" ? "Bank:" : "Location:",
									" ",
									s.accountName
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleEdit(s),
									className: "text-blue-500 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 -mr-1 -mt-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "w-4 h-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => handleDelete(s.id),
									className: "text-red-500 h-8 w-8 -mr-2 -mt-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash, { className: "w-4 h-4" })
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-2xl font-bold text-zinc-900 dark:text-zinc-50",
								children: formatMoney(s.amount)
							})
						})]
					})
				}, s.id)), savings.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "col-span-full text-center py-12 text-zinc-500",
					children: "Your vault is currently empty. Add some savings to secure them here."
				})]
			})
		]
	});
}
//#endregion
export { SavingsPage as component };
