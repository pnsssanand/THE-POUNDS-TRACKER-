import type { ShoppingItem } from "@/types";
import {
  createDocument,
  deleteDocument,
  subscribeCollection,
  getCollection,
  updateDocument,
} from "./collectionService";

const NAME = "shoppingList";

export const SHOPPING_CATEGORIES = [
  "Indian Store",
  "Groceries",
  "Vegetables & Fruits",
  "Dairy & Eggs",
  "Bakery",
  "Meat & Seafood",
  "Snacks & Drinks",
  "Household & Cleaning",
  "Personal Care",
  "Other",
] as const;

export const SHOPPING_UNITS = [
  "pcs",
  "kg",
  "g",
  "pack",
  "bottle",
  "can",
  "box",
  "bunch",
  "litres",
] as const;

export type ShoppingItemInput = Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">;

export function subscribeShoppingItems(
  uid: string,
  onData: (rows: ShoppingItem[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return subscribeCollection<ShoppingItem>(uid, NAME, onData, onError);
}

export function getShoppingItems(uid: string): Promise<ShoppingItem[]> {
  return getCollection<ShoppingItem>(uid, NAME);
}

export const addShoppingItem = (uid: string, input: ShoppingItemInput) =>
  createDocument(uid, NAME, input);

export const updateShoppingItem = (
  uid: string,
  id: string,
  input: Partial<ShoppingItemInput>,
) => updateDocument(uid, NAME, id, input);

export const deleteShoppingItem = (uid: string, id: string) =>
  deleteDocument(uid, NAME, id);
