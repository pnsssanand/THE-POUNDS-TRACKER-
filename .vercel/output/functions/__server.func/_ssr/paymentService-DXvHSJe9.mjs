import "../_libs/firebase.mjs";
import { o as orderBy } from "../_libs/@firebase/firestore+[...].mjs";
import { c as subscribeCollection, n as deleteDocument, o as getCollection, t as createDocument, u as updateDocument } from "./format-BgBAw96h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/paymentService-DXvHSJe9.js
var UPCOMING = "upcomingPayments";
var INCOMING = "incomingPayments";
function subscribeUpcomingPayments(uid, onData, onError) {
	return subscribeCollection(uid, UPCOMING, onData, onError, [orderBy("dueDate", "asc")]);
}
function getUpcomingPayments(uid) {
	return getCollection(uid, UPCOMING, [orderBy("dueDate", "asc")]);
}
function subscribeIncomingPayments(uid, onData, onError) {
	return subscribeCollection(uid, INCOMING, onData, onError, [orderBy("expectedDate", "asc")]);
}
function getIncomingPayments(uid) {
	return getCollection(uid, INCOMING, [orderBy("expectedDate", "asc")]);
}
var addUpcomingPayment = (uid, input) => createDocument(uid, UPCOMING, input);
var updateUpcomingPayment = (uid, id, input) => updateDocument(uid, UPCOMING, id, input);
var deleteUpcomingPayment = (uid, id) => deleteDocument(uid, UPCOMING, id);
var addIncomingPayment = (uid, input) => createDocument(uid, INCOMING, input);
var updateIncomingPayment = (uid, id, input) => updateDocument(uid, INCOMING, id, input);
var deleteIncomingPayment = (uid, id) => deleteDocument(uid, INCOMING, id);
//#endregion
export { getIncomingPayments as a, subscribeUpcomingPayments as c, deleteUpcomingPayment as i, updateIncomingPayment as l, addUpcomingPayment as n, getUpcomingPayments as o, deleteIncomingPayment as r, subscribeIncomingPayments as s, addIncomingPayment as t, updateUpcomingPayment as u };
