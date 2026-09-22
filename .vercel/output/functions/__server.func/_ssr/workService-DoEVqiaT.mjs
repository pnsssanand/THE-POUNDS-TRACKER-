import "../_libs/firebase.mjs";
import { o as orderBy } from "../_libs/@firebase/firestore+[...].mjs";
import { c as subscribeCollection, n as deleteDocument, o as getCollection, t as createDocument, u as updateDocument } from "./format-BgBAw96h.mjs";
import { f as computeWorkSessionTotals } from "./calc-DutBGfy3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/workService-DoEVqiaT.js
var NAME = "workSessions";
function subscribeWorkSessions(uid, onData, onError) {
	return subscribeCollection(uid, NAME, onData, onError, [orderBy("workDate", "desc")]);
}
function getWorkSessions(uid) {
	return getCollection(uid, NAME, [orderBy("workDate", "desc")]);
}
function addWorkSession(uid, input) {
	return createDocument(uid, NAME, {
		...input,
		...computeWorkSessionTotals(input)
	});
}
function updateWorkSession(uid, id, input) {
	return updateDocument(uid, NAME, id, {
		...input,
		...computeWorkSessionTotals(input)
	});
}
function deleteWorkSession(uid, id) {
	return deleteDocument(uid, NAME, id);
}
//#endregion
export { updateWorkSession as a, subscribeWorkSessions as i, deleteWorkSession as n, getWorkSessions as r, addWorkSession as t };
