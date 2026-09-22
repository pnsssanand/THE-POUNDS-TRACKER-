import { o as getApps, s as initializeApp } from "../_libs/@firebase/app+[...].mjs";
import { a as updateProfile, i as signInWithEmailAndPassword, n as getAuth, r as onAuthStateChanged, t as createUserWithEmailAndPassword } from "../_libs/firebase__auth.mjs";
import "../_libs/firebase.mjs";
import { c as setDoc, d as doc, f as getFirestore, p as serverTimestamp, r as getDoc } from "../_libs/@firebase/firestore+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/authService-Bu2b5XPT.js
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
var firebaseConfig = {
	apiKey: env["VITE_FIREBASE_API_KEY"] ?? "",
	authDomain: env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "the-pounds-tracker.firebaseapp.com",
	projectId: env["VITE_FIREBASE_PROJECT_ID"] ?? "the-pounds-tracker",
	storageBucket: env["VITE_FIREBASE_STORAGE_BUCKET"] ?? "the-pounds-tracker.firebasestorage.app",
	messagingSenderId: env["VITE_FIREBASE_MESSAGING_SENDER_ID"] ?? "711016617322",
	appId: env["VITE_FIREBASE_APP_ID"] ?? "1:711016617322:web:7372d8c407604fbbcf4113",
	measurementId: env["VITE_FIREBASE_MEASUREMENT_ID"] ?? ""
};
var isFirebaseConfigured = firebaseConfig.apiKey.length > 0;
var app = null;
var authInstance = null;
var dbInstance = null;
function getFirebaseApp() {
	if (!isFirebaseConfigured) throw new Error("FIREBASE_NOT_CONFIGURED");
	if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
	return app;
}
function getFirebaseAuth() {
	if (!authInstance) authInstance = getAuth(getFirebaseApp());
	return authInstance;
}
function getDb() {
	if (!dbInstance) dbInstance = getFirestore(getFirebaseApp());
	return dbInstance;
}
var DEFAULT_BANKS = [
	"HSBC",
	"Barclays",
	"Lloyds",
	"NatWest",
	"Monzo",
	"Revolut",
	"Santander",
	"Starling"
];
var DEFAULT_SETTINGS = {
	monthlyHoursTarget: 0,
	monthlyEarningsTarget: 0,
	preferredPaymentMode: "cash",
	preferredBank: "",
	banks: DEFAULT_BANKS,
	savingsPinHash: null,
	last80PercentNotificationMonth: null
};
function normaliseUsername(username) {
	return username.trim().toLowerCase();
}
async function isUsernameAvailable(username) {
	return !(await getDoc(doc(getDb(), "usernames", normaliseUsername(username)))).exists();
}
async function resolveEmailFromUsername(username) {
	const snap = await getDoc(doc(getDb(), "usernames", normaliseUsername(username)));
	const data = snap.data();
	if (!snap.exists() || !data?.["email"]) throw new Error("USERNAME_NOT_FOUND");
	return String(data["email"]);
}
async function createUserRecords(params) {
	const db = getDb();
	const username = normaliseUsername(params.username);
	await setDoc(doc(db, "users", params.uid), {
		uid: params.uid,
		email: params.email,
		username,
		displayName: params.displayName,
		photoURL: null,
		phoneNumber: null,
		role: params.role ?? "user",
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
		lastLoginAt: serverTimestamp()
	});
	await setDoc(doc(db, "usernames", username), {
		uid: params.uid,
		email: params.email
	});
	await setDoc(doc(db, "users", params.uid, "settings", "profile"), DEFAULT_SETTINGS);
}
function toISO(value) {
	if (!value) return void 0;
	if (typeof value === "object" && value !== null && "toDate" in value) return value.toDate().toISOString();
	return typeof value === "string" ? value : void 0;
}
async function getUserProfile(uid) {
	const snap = await getDoc(doc(getDb(), "users", uid));
	if (!snap.exists()) return null;
	const data = snap.data();
	return {
		uid,
		username: String(data["username"] ?? ""),
		email: String(data["email"] ?? ""),
		displayName: String(data["displayName"] ?? ""),
		photoURL: data["photoURL"] ?? null,
		photoPublicId: data["photoPublicId"] ?? null,
		phoneNumber: data["phoneNumber"] ?? null,
		role: data["role"] === "admin" ? "admin" : "user",
		createdAt: toISO(data["createdAt"]),
		updatedAt: toISO(data["updatedAt"]),
		lastLoginAt: toISO(data["lastLoginAt"])
	};
}
async function updateUserProfile(uid, patch) {
	await setDoc(doc(getDb(), "users", uid), {
		...patch,
		updatedAt: serverTimestamp()
	}, { merge: true });
}
async function touchLastLogin(uid) {
	await setDoc(doc(getDb(), "users", uid), { lastLoginAt: serverTimestamp() }, { merge: true });
}
async function getSettings(uid) {
	const snap = await getDoc(doc(getDb(), "users", uid, "settings", "profile"));
	if (!snap.exists()) return { ...DEFAULT_SETTINGS };
	const data = snap.data();
	return {
		monthlyHoursTarget: Number(data["monthlyHoursTarget"] ?? 0),
		monthlyEarningsTarget: Number(data["monthlyEarningsTarget"] ?? 0),
		preferredPaymentMode: data["preferredPaymentMode"] === "card" ? "card" : "cash",
		preferredBank: String(data["preferredBank"] ?? ""),
		banks: Array.isArray(data["banks"]) ? data["banks"] : DEFAULT_BANKS,
		savingsPinHash: data["savingsPinHash"] ?? null,
		last80PercentNotificationMonth: data["last80PercentNotificationMonth"] ?? null
	};
}
async function updateSettings(uid, patch) {
	await setDoc(doc(getDb(), "users", uid, "settings", "profile"), patch, { merge: true });
}
function watchAuth(callback) {
	return onAuthStateChanged(getFirebaseAuth(), callback);
}
async function signUp(params) {
	const username = normaliseUsername(params.username);
	if (!await isUsernameAvailable(username)) throw new Error("USERNAME_TAKEN");
	const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), params.email.trim(), params.password);
	await updateProfile(credential.user, { displayName: params.fullName });
	await createUserRecords({
		uid: credential.user.uid,
		email: params.email.trim(),
		username,
		displayName: params.fullName
	});
	return credential.user;
}
async function login(identifier, password) {
	const value = identifier.trim();
	const email = value.includes("@") ? value : await resolveEmailFromUsername(value);
	const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
	await touchLastLogin(credential.user.uid).catch(() => void 0);
	return credential.user;
}
//#endregion
export { login as a, updateUserProfile as c, isFirebaseConfigured as i, watchAuth as l, getSettings as n, signUp as o, getUserProfile as r, updateSettings as s, getDb as t };
