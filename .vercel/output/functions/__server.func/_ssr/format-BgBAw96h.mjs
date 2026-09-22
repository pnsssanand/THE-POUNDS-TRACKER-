import "../_libs/firebase.mjs";
import { a as onSnapshot, d as doc, i as getDocs, l as updateDoc, n as deleteDoc, o as orderBy, p as serverTimestamp, s as query, t as addDoc, u as collection } from "../_libs/@firebase/firestore+[...].mjs";
import { t as getDb } from "./authService-Bu2b5XPT.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/format-BgBAw96h.js
function stripUndefined(value) {
	return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== void 0));
}
function subscribeCollection(uid, name, onData, onError, constraints = [orderBy("createdAt", "desc")]) {
	const ref = collection(getDb(), "users", uid, name);
	return onSnapshot(query(ref, ...constraints), (snap) => {
		onData(snap.docs.map((d) => ({
			id: d.id,
			...d.data()
		})));
	}, onError);
}
async function getCollection(uid, name, constraints = [orderBy("createdAt", "desc")]) {
	const ref = collection(getDb(), "users", uid, name);
	return (await getDocs(query(ref, ...constraints))).docs.map((d) => ({
		id: d.id,
		...d.data()
	}));
}
async function createDocument(uid, name, data) {
	return (await addDoc(collection(getDb(), "users", uid, name), {
		...stripUndefined(data),
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	})).id;
}
async function updateDocument(uid, name, id, data) {
	await updateDoc(doc(getDb(), "users", uid, name, id), {
		...stripUndefined(data),
		updatedAt: serverTimestamp()
	});
}
async function deleteDocument(uid, name, id) {
	await deleteDoc(doc(getDb(), "users", uid, name, id));
}
var gbp = new Intl.NumberFormat("en-GB", {
	style: "currency",
	currency: "GBP",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
function formatMoney(value) {
	return gbp.format(Number.isFinite(value) ? value : 0);
}
function formatHours(hours) {
	const total = Math.max(0, Math.round(hours * 60));
	const h = Math.floor(total / 60);
	const m = total % 60;
	return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
/** DD/MM/YYYY from an ISO date (YYYY-MM-DD). */
function formatDateUK(iso) {
	if (!iso) return "";
	const [y, m, d] = iso.split("-");
	if (!y || !m || !d) return iso;
	return `${d}/${m}/${y}`;
}
/** Local (Europe/London aware via browser locale) ISO date for a Date. */
function toISODate(date) {
	return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}
function todayISO() {
	return toISODate(/* @__PURE__ */ new Date());
}
/** YYYY-MM month key. */
function monthKey(iso = todayISO()) {
	return iso.slice(0, 7);
}
//#endregion
export { formatMoney as a, subscribeCollection as c, formatHours as i, todayISO as l, deleteDocument as n, getCollection as o, formatDateUK as r, monthKey as s, createDocument as t, updateDocument as u };
