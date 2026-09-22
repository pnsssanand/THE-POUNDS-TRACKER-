import { c as subscribeCollection, n as deleteDocument, o as getCollection, t as createDocument, u as updateDocument } from "./format-BgBAw96h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/savingsService-otpeLm6n.js
var NAME = "savings";
function subscribeSavings(uid, onData, onError) {
	return subscribeCollection(uid, NAME, onData, onError);
}
function getSavings(uid) {
	return getCollection(uid, NAME);
}
var addSaving = (uid, input) => createDocument(uid, NAME, input);
var updateSaving = (uid, id, input) => updateDocument(uid, NAME, id, input);
var deleteSaving = (uid, id) => deleteDocument(uid, NAME, id);
//#endregion
export { updateSaving as a, subscribeSavings as i, deleteSaving as n, getSavings as r, addSaving as t };
