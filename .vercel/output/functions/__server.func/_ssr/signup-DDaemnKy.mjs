import { o as __toESM } from "../_runtime.mjs";
import { o as signUp } from "./authService-Bu2b5XPT.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { a as CardFooter, i as CardDescription, n as Card, o as CardHeader, r as CardContent, s as CardTitle, t as Button } from "./button-TSKh01qk.mjs";
import { t as Input } from "./label-CM5v66cH.mjs";
import { T as CircleAlert } from "../_libs/lucide-react.mjs";
import { i as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { a as FormField, c as FormMessage, i as FormControl, n as AlertDescription, o as FormItem, r as Form, s as FormLabel, t as Alert } from "./alert-CoQUrO7Z.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as stringType, t as objectType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signup-DDaemnKy.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var signupSchema = objectType({
	fullName: stringType().min(2, "Full name is required"),
	username: stringType().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
	email: stringType().email("Invalid email address"),
	password: stringType().min(6, "Password must be at least 6 characters"),
	confirmPassword: stringType()
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"]
});
function Signup() {
	const navigate = useNavigate();
	const [error, setError] = (0, import_react.useState)(null);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const form = useForm({
		resolver: u(signupSchema),
		defaultValues: {
			fullName: "",
			username: "",
			email: "",
			password: "",
			confirmPassword: ""
		}
	});
	async function onSubmit(data) {
		setIsLoading(true);
		setError(null);
		try {
			await signUp({
				fullName: data.fullName,
				username: data.username,
				email: data.email,
				password: data.password
			});
			navigate({ to: "/" });
		} catch (err) {
			if (err.message === "FIREBASE_NOT_CONFIGURED") setError("Firebase is not configured. Please add your credentials to the .env file.");
			else setError(err.message || "An unexpected error occurred during signup.");
		} finally {
			setIsLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "w-full max-w-md shadow-xl transition-all duration-300 hover:shadow-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-3xl font-bold tracking-tight",
						children: "Create an account"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, {
						className: "text-zinc-500 dark:text-zinc-400",
						children: "Enter your details below to create your account"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Alert, {
					variant: "destructive",
					className: "mb-6 animate-in fade-in slide-in-from-top-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertDescription, { children: error })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Form, {
					...form,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: form.handleSubmit(onSubmit),
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								control: form.control,
								name: "fullName",
								render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormItem, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormLabel, { children: "Full Name" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormControl, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "John Doe",
										...field,
										className: "transition-all focus:ring-2 focus:ring-primary/20"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								control: form.control,
								name: "username",
								render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormItem, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormLabel, { children: "Username" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormControl, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										placeholder: "johndoe123",
										...field,
										className: "transition-all focus:ring-2 focus:ring-primary/20"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								control: form.control,
								name: "email",
								render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormItem, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormLabel, { children: "Email" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormControl, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "email",
										placeholder: "john@example.com",
										...field,
										className: "transition-all focus:ring-2 focus:ring-primary/20"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								control: form.control,
								name: "password",
								render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormItem, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormLabel, { children: "Password" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormControl, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "password",
										placeholder: "••••••••",
										...field,
										className: "transition-all focus:ring-2 focus:ring-primary/20"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								control: form.control,
								name: "confirmPassword",
								render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormItem, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormLabel, { children: "Confirm Password" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormControl, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "password",
										placeholder: "••••••••",
										...field,
										className: "transition-all focus:ring-2 focus:ring-primary/20"
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormMessage, {})
								] })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "w-full",
								disabled: isLoading,
								children: isLoading ? "Creating account..." : "Sign up"
							})
						]
					})
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardFooter, {
					className: "flex flex-col space-y-4 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm text-zinc-500 dark:text-zinc-400",
						children: [
							"Already have an account?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/login",
								className: "font-medium text-primary hover:underline hover:text-primary/90",
								children: "Sign in"
							})
						]
					})
				})
			]
		})
	});
}
//#endregion
export { Signup as component };
