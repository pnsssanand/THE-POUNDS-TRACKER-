import "../_libs/firebase.mjs";
import { o as orderBy } from "../_libs/@firebase/firestore+[...].mjs";
import { c as subscribeCollection, n as deleteDocument, o as getCollection, t as createDocument, u as updateDocument } from "./format-BgBAw96h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/expenseService-7IbBkoOG.js
var NAME = "expenses";
var EXPENSE_CATEGORIES = [
	"Food",
	"Groceries",
	"Transport",
	"Rent",
	"Bills",
	"Shopping",
	"Entertainment",
	"Education",
	"Travel",
	"Family",
	"Health",
	"Subscriptions",
	"Other"
];
function subscribeExpenses(uid, onData, onError) {
	return subscribeCollection(uid, NAME, onData, onError, [orderBy("date", "desc")]);
}
function getExpenses(uid) {
	return getCollection(uid, NAME, [orderBy("date", "desc")]);
}
var addExpense = (uid, input) => createDocument(uid, NAME, input);
var updateExpense = (uid, id, input) => updateDocument(uid, NAME, id, input);
var deleteExpense = (uid, id) => deleteDocument(uid, NAME, id);
//#endregion
export { subscribeExpenses as a, getExpenses as i, addExpense as n, updateExpense as o, deleteExpense as r, EXPENSE_CATEGORIES as t };
