import { o as __toESM } from "../_runtime.mjs";
import { i as isFirebaseConfigured, l as watchAuth } from "./authService-Bu2b5XPT.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { p as require_jsx_runtime } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AuthContext-QdaOKkmJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var AuthContext = (0, import_react.createContext)({
	user: null,
	loading: true,
	firebaseError: false
});
var useAuth = () => (0, import_react.useContext)(AuthContext);
function AuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [firebaseError, setFirebaseError] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!isFirebaseConfigured) {
			setFirebaseError(true);
			setLoading(false);
			return;
		}
		try {
			const unsubscribe = watchAuth((u) => {
				setUser(u);
				setLoading(false);
			});
			return () => unsubscribe();
		} catch (e) {
			console.error("Auth error:", e);
			setFirebaseError(true);
			setLoading(false);
		}
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: {
			user,
			loading,
			firebaseError
		},
		children
	});
}
//#endregion
export { useAuth as n, AuthProvider as t };
