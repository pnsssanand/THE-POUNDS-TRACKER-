import { o as __toESM } from "../_runtime.mjs";
import { c as updateUserProfile, n as getSettings, r as getUserProfile, s as updateSettings } from "./authService-Bu2b5XPT.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { n as useAuth } from "./AuthContext-QdaOKkmJ.mjs";
import { i as CardDescription, n as Card, o as CardHeader, r as CardContent, s as CardTitle, t as Button } from "./button-TSKh01qk.mjs";
import { n as Label, t as Input } from "./label-CM5v66cH.mjs";
import { i as Upload, r as User, u as Save, y as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-BTEU47zT.mjs";
import { t as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-mp4JLzFu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var env = {
	"BASE_URL": "/",
	"DEV": false,
	"MODE": "production",
	"PROD": true,
	"SSR": true,
	"TSS_DEV_SERVER": "false",
	"TSS_DEV_SSR_STYLES_BASEPATH": "/",
	"TSS_DEV_SSR_STYLES_ENABLED": "true",
	"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
	"TSS_INLINE_CSS_ENABLED": "false",
	"TSS_ROUTER_BASEPATH": "",
	"TSS_SERVER_FN_BASE": "/_serverFn/",
	"VITE_FIREBASE_API_KEY": "AIzaSyDeXT9AVgWpkn3OqxSAkv3MxVUZnU3sK5A",
	"VITE_FIREBASE_APP_ID": "1:711016617322:web:7372d8c407604fbbcf4113",
	"VITE_FIREBASE_AUTH_DOMAIN": "the-pounds-tracker.firebaseapp.com",
	"VITE_FIREBASE_MEASUREMENT_ID": "G-9LDESTSBRK",
	"VITE_FIREBASE_MESSAGING_SENDER_ID": "711016617322",
	"VITE_FIREBASE_PROJECT_ID": "the-pounds-tracker",
	"VITE_FIREBASE_STORAGE_BUCKET": "the-pounds-tracker.firebasestorage.app"
};
var CLOUDINARY_CLOUD_NAME = env["VITE_CLOUDINARY_CLOUD_NAME"] ?? "dlvjvskje";
var CLOUDINARY_UPLOAD_PRESET = env["VITE_CLOUDINARY_UPLOAD_PRESET"] ?? "THE POUNDS TRACKER";
var MAX_BYTES = 5242880;
/** Unsigned browser upload. No API secret is used or required. */
async function uploadProfileImage(file) {
	if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG, PNG or WebP).");
	if (file.size > MAX_BYTES) throw new Error("That image is larger than 5MB. Please choose a smaller one.");
	const body = new FormData();
	body.append("file", file);
	body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
	const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
		method: "POST",
		body
	});
	if (!response.ok) {
		if ((await response.text()).includes("preset")) throw new Error(`The image service rejected the upload preset "${CLOUDINARY_UPLOAD_PRESET}". It must exist and be set to Unsigned in Cloudinary.`);
		throw new Error("The image couldn't be uploaded. Please try again.");
	}
	const data = await response.json();
	if (!data.secure_url || !data.public_id) throw new Error("The image upload returned no image.");
	return {
		secureUrl: data.secure_url,
		publicId: data.public_id
	};
}
function ProfilePage() {
	const { user: authUser } = useAuth();
	const uid = authUser?.uid;
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [settings, setSettings] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [isSaving, setIsSaving] = (0, import_react.useState)(false);
	const [isUploading, setIsUploading] = (0, import_react.useState)(false);
	const fileInputRef = (0, import_react.useRef)(null);
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [phoneNumber, setPhoneNumber] = (0, import_react.useState)("");
	const [monthlyHoursTarget, setMonthlyHoursTarget] = (0, import_react.useState)("");
	const [monthlyEarningsTarget, setMonthlyEarningsTarget] = (0, import_react.useState)("");
	const [preferredPaymentMode, setPreferredPaymentMode] = (0, import_react.useState)("cash");
	const [preferredBank, setPreferredBank] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!uid) return;
		Promise.all([getUserProfile(uid), getSettings(uid)]).then(([p, s]) => {
			setProfile(p);
			setSettings(s);
			if (p) {
				setDisplayName(p.displayName || "");
				setPhoneNumber(p.phoneNumber || "");
			}
			if (s) {
				setMonthlyHoursTarget(s.monthlyHoursTarget?.toString() || "0");
				setMonthlyEarningsTarget(s.monthlyEarningsTarget?.toString() || "0");
				setPreferredPaymentMode(s.preferredPaymentMode || "cash");
				setPreferredBank(s.preferredBank || "");
			}
			setLoading(false);
		}).catch(console.error);
	}, [uid]);
	const handleImageUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file || !uid) return;
		setIsUploading(true);
		try {
			const result = await uploadProfileImage(file);
			await updateUserProfile(uid, {
				photoURL: result.secureUrl,
				photoPublicId: result.publicId
			});
			setProfile((prev) => prev ? {
				...prev,
				photoURL: result.secureUrl,
				photoPublicId: result.publicId
			} : null);
			if (window.toast) toast.success("Profile picture updated!");
			else alert("Profile picture updated!");
		} catch (err) {
			console.error(err);
			if (window.toast) toast.error(err.message || "Failed to upload image");
			else alert(err.message || "Failed to upload image");
		} finally {
			setIsUploading(false);
		}
	};
	const handleSave = async (e) => {
		e.preventDefault();
		if (!uid) return;
		setIsSaving(true);
		try {
			await Promise.all([updateUserProfile(uid, {
				displayName,
				phoneNumber
			}), updateSettings(uid, {
				monthlyHoursTarget: parseFloat(monthlyHoursTarget) || 0,
				monthlyEarningsTarget: parseFloat(monthlyEarningsTarget) || 0,
				preferredPaymentMode,
				preferredBank: preferredPaymentMode === "card" ? preferredBank : ""
			})]);
			setProfile((prev) => prev ? {
				...prev,
				displayName,
				phoneNumber
			} : null);
			if (window.toast) toast.success("Profile saved successfully");
			else alert("Profile saved successfully");
		} catch (err) {
			console.error(err);
			if (window.toast) toast.error("Failed to save profile");
			else alert("Failed to save profile");
		} finally {
			setIsSaving(false);
		}
	};
	if (loading || !profile || !settings) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "animate-pulse text-zinc-500",
			children: "Loading profile..."
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-3xl font-bold tracking-tight",
			children: "Profile & Settings"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-zinc-500 mt-1",
			children: "Manage your account and monthly targets."
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-8 md:grid-cols-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:col-span-1 space-y-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "shadow-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-6 flex flex-col items-center text-center space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center",
									children: [profile.photoURL ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: profile.photoURL,
										alt: "Profile",
										className: "w-full h-full object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-12 h-12 text-zinc-400" }), isUploading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute inset-0 bg-black/50 flex items-center justify-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-6 h-6 text-white animate-spin" })
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => fileInputRef.current?.click(),
									disabled: isUploading,
									className: "absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "w-4 h-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "file",
									ref: fileInputRef,
									className: "hidden",
									accept: "image/jpeg,image/png,image/webp",
									onChange: handleImageUpload
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-bold text-xl",
								children: profile.displayName || profile.username
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-zinc-500 text-sm",
								children: profile.email
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "inline-block mt-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full uppercase tracking-wider font-semibold",
								children: profile.role
							})
						] })]
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:col-span-2 space-y-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSave,
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Personal Information" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Update your personal details." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: displayName,
											onChange: (e) => setDisplayName(e.target.value),
											placeholder: "John Doe"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Username" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: profile.username,
											disabled: true,
											className: "bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Email" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: profile.email,
											disabled: true,
											className: "bg-zinc-50 dark:bg-zinc-900 text-zinc-500"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: phoneNumber,
											onChange: (e) => setPhoneNumber(e.target.value),
											placeholder: "+44 7700 900077"
										})]
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "shadow-sm border-l-4 border-l-emerald-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Monthly Goals" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Set targets to track on your dashboard." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
								className: "space-y-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Hours Target" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: "0",
											value: monthlyHoursTarget,
											onChange: (e) => setMonthlyHoursTarget(e.target.value)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Earnings Target (£)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											min: "0",
											step: "0.01",
											value: monthlyEarningsTarget,
											onChange: (e) => setMonthlyEarningsTarget(e.target.value)
										})]
									})]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "shadow-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Preferences" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Default settings for data entry." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
								className: "space-y-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Preferred Payment Method" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: preferredPaymentMode,
											onValueChange: (v) => setPreferredPaymentMode(v),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "cash",
												children: "Cash"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: "card",
												children: "Card"
											})] })]
										})]
									}), preferredPaymentMode === "card" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Preferred Bank" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											value: preferredBank,
											onChange: (e) => setPreferredBank(e.target.value),
											placeholder: "e.g. Barclays"
										})]
									})]
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-end",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								size: "lg",
								disabled: isSaving,
								className: "w-full sm:w-auto",
								children: [isSaving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 mr-2 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "w-4 h-4 mr-2" }), "Save Changes"]
							})
						})
					]
				})
			})]
		})]
	});
}
//#endregion
export { ProfilePage as component };
