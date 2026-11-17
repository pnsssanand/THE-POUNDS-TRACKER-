import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  ShoppingCart,
  Receipt,
  Edit2,
  Save,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Tag,
  AlertCircle,
  CheckCircle2,
  Coins,
} from "lucide-react";
import type { Expense, ShoppingExpenseItem } from "@/types";
import { formatMoney, formatINR, formatDateUK } from "../../lib/format";
import { toast } from "sonner";

interface ShoppingBreakdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  gbpRate?: number;
  onSaveExpenseItems?: (
    expenseId: string,
    updatedItems: ShoppingExpenseItem[],
    updatedNotes: string
  ) => Promise<void>;
}

/**
 * Smartly parse items from structured expense.items OR extract from expense.notes text
 */
export function parseShoppingItemsFromExpense(expense: Expense): ShoppingExpenseItem[] {
  if (Array.isArray(expense.items) && expense.items.length > 0) {
    return expense.items.map((it, idx) => ({
      id: it.id || `item-${idx}`,
      name: it.name || "Item",
      quantity: Number(it.quantity) || 1,
      unit: it.unit || "pcs",
      price: Number(it.price) || 0,
      total:
        Number(it.total) ||
        Math.round((Number(it.price) || 0) * (Number(it.quantity) || 1) * 100) / 100,
    }));
  }

  if (!expense.notes) return [];

  let raw = expense.notes.trim();
  if (raw.toLowerCase().startsWith("items:")) {
    raw = raw.slice(6).trim();
  }

  if (!raw) return [];

  const lines = raw.includes("\n")
    ? raw.split("\n").map((s) => s.trim()).filter(Boolean)
    : raw.split(",").map((s) => s.trim()).filter(Boolean);

  const parsed: ShoppingExpenseItem[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line) continue;

    // Pattern 1: Name (x2 @ £1.50 = £3.00) or Name (2 pcs @ £1.50 = £3.00)
    const matchFull = line.match(
      /^([^(]+?)\s*\(\s*(?:x\s*)?(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*@\s*[£$€]?([0-9.]+)\s*(?:=\s*[£$€]?([0-9.]+))?\s*\)$/i
    );
    if (matchFull) {
      const name = matchFull[1].trim();
      const qty = parseFloat(matchFull[2]) || 1;
      const unit = matchFull[3] || "pcs";
      const unitPrice = parseFloat(matchFull[4]) || 0;
      const total = matchFull[5]
        ? parseFloat(matchFull[5])
        : Math.round(qty * unitPrice * 100) / 100;
      parsed.push({
        id: `parsed-${idx}`,
        name,
        quantity: qty,
        unit,
        price: unitPrice,
        total,
      });
      continue;
    }

    // Pattern 2: Name (x2) or Name (2 pcs) or Name (x1)
    const matchQty = line.match(
      /^([^(]+?)\s*\(\s*(?:x\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?)\s*\)$/i
    );
    if (matchQty) {
      const name = matchQty[1].trim();
      const qty = parseFloat(matchQty[2] || matchQty[3]) || 1;
      const unit = matchQty[4] || "pcs";
      parsed.push({
        id: `parsed-${idx}`,
        name,
        quantity: qty,
        unit,
        price: 0,
        total: 0,
      });
      continue;
    }

    // Pattern 3: Name: £2.50 or Name - £2.50
    const matchSimplePrice = line.match(/^([^:\-]+?)[:\-]\s*[£$€]?([0-9.]+)$/i);
    if (matchSimplePrice) {
      const name = matchSimplePrice[1].trim();
      const price = parseFloat(matchSimplePrice[2]) || 0;
      parsed.push({
        id: `parsed-${idx}`,
        name,
        quantity: 1,
        unit: "pcs",
        price,
        total: price,
      });
      continue;
    }

    // Pattern 4: Fallback - just name
    parsed.push({
      id: `parsed-${idx}`,
      name: line.replace(/^[•\-\*]\s*/, "").trim(),
      quantity: 1,
      unit: "pcs",
      price: 0,
      total: 0,
    });
  }

  return parsed;
}

export function ShoppingBreakdownDialog({
  open,
  onOpenChange,
  expense,
  gbpRate = 124.71,
  onSaveExpenseItems,
}: ShoppingBreakdownDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState<ShoppingExpenseItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync items whenever dialog opens or expense changes
  useEffect(() => {
    if (expense) {
      const parsed = parseShoppingItemsFromExpense(expense);
      setEditableItems(parsed);
      setIsEditing(false);
    } else {
      setEditableItems([]);
      setIsEditing(false);
    }
  }, [expense, open]);

  // Calculated sum of all items in list
  const calculatedItemsTotal = useMemo(() => {
    return (
      Math.round(
        editableItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0) * 100
      ) / 100
    );
  }, [editableItems]);

  if (!expense) return null;

  const hasMissingPrices = editableItems.length > 0 && editableItems.some((i) => (i.price || 0) <= 0);

  // Handle item property change in edit mode
  const handleItemChange = (index: number, field: keyof ShoppingExpenseItem, value: any) => {
    setEditableItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], [field]: value };

      if (field === "quantity" || field === "price") {
        const qty = field === "quantity" ? parseFloat(value) || 0 : cur.quantity || 0;
        const price = field === "price" ? parseFloat(value) || 0 : cur.price || 0;
        cur.total = Math.round(qty * price * 100) / 100;
      }

      next[index] = cur;
      return next;
    });
  };

  // Add new item in edit mode
  const handleAddNewItem = () => {
    setEditableItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: "",
        quantity: 1,
        unit: "pcs",
        price: 0,
        total: 0,
      },
    ]);
  };

  // Remove an item in edit mode
  const handleRemoveItem = (index: number) => {
    setEditableItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save updated items back to Firestore
  const handleSave = async () => {
    if (!onSaveExpenseItems || !expense) return;

    setIsSaving(true);
    try {
      const cleanItems = editableItems
        .filter((i) => i.name.trim().length > 0)
        .map((i) => ({
          name: i.name.trim(),
          quantity: Number(i.quantity) || 1,
          unit: i.unit || "pcs",
          price: Number(i.price) || 0,
          total:
            Number(i.total) ||
            Math.round((Number(i.price) || 0) * (Number(i.quantity) || 1) * 100) / 100,
        }));

      const formattedNotes = cleanItems
        .map(
          (i) =>
            `${i.name} (x${i.quantity} ${i.unit} @ £${i.price.toFixed(2)} = £${i.total.toFixed(2)})`
        )
        .join(", ");

      await onSaveExpenseItems(
        expense.id,
        cleanItems,
        formattedNotes ? `Items: ${formattedNotes}` : (expense.notes || "")
      );

      toast.success("Item prices saved successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save item prices:", err);
      toast.error("Failed to save item prices");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>{expense.purpose}</span>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Shopping Cart
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {formatDateUK(expense.date)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-zinc-400" />
                    {expense.category}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                    {expense.paymentMode === "card"
                      ? `Card ${expense.bankName ? `(${expense.bankName})` : ""}`
                      : "Cash"}
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Total Expense Pill */}
            <div className="text-right">
              <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {formatMoney(expense.amount)}
              </div>
              <div className="text-xs font-semibold text-zinc-500">
                ≈ {formatINR(expense.amount, gbpRate)}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Missing Prices Notice (if past expense didn't have per-item prices recorded) */}
          {hasMissingPrices && !isEditing && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold">Some items don't have individual prices stored.</span>
                  <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                    Click <strong>"Edit Item Prices"</strong> below to enter the price for each item and save it.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-7 text-xs font-medium border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 shrink-0"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Enter Prices
              </Button>
            </div>
          )}

          {/* Items Breakdown Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs bg-white dark:bg-zinc-900">
            <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="font-semibold text-xs tracking-wider uppercase text-zinc-600 dark:text-zinc-300">
                Itemized List ({editableItems.length} {editableItems.length === 1 ? "item" : "items"})
              </span>

              {!isEditing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                  className="h-7 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Edit Item Prices
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddNewItem}
                  className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:border-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Item
                </Button>
              )}
            </div>

            {editableItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                <ShoppingCart className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                No items recorded for this shopping run.
                {isEditing && (
                  <div className="mt-3">
                    <Button size="sm" onClick={handleAddNewItem} className="h-8 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add First Item
                    </Button>
                  </div>
                )}
              </div>
            ) : !isEditing ? (
              // READ-ONLY VIEW
              <div className="divide-y divide-zinc-100 dark:divide-y-zinc-800">
                {editableItems.map((item, index) => {
                  const unitPrice = Number(item.price) || 0;
                  const qty = Number(item.quantity) || 1;
                  const itemTotal = Number(item.total) || Math.round(unitPrice * qty * 100) / 100;

                  return (
                    <div
                      key={item.id || index}
                      className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-zinc-400 w-5 text-right shrink-0">
                          {index + 1}.
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                            <span className="font-medium text-zinc-600 dark:text-zinc-400">
                              Qty: {qty} {item.unit || "pcs"}
                            </span>
                            {unitPrice > 0 && (
                              <>
                                <span>•</span>
                                <span>@ {formatMoney(unitPrice)} each</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {itemTotal > 0 ? (
                          <>
                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {formatMoney(itemTotal)}
                            </div>
                            <div className="text-[11px] font-medium text-zinc-500">
                              ≈ {formatINR(itemTotal, gbpRate)}
                            </div>
                          </>
                        ) : (
                          <Badge
                            variant="secondary"
                            onClick={() => setIsEditing(true)}
                            className="text-[11px] cursor-pointer hover:bg-amber-100 text-amber-700 border-amber-300 dark:text-amber-300"
                          >
                            + Add price
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // EDIT MODE
              <div className="p-3 space-y-2">
                {editableItems.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-wrap sm:flex-nowrap items-center gap-2"
                  >
                    <span className="text-xs font-mono text-zinc-400 w-4 text-center shrink-0">
                      {index + 1}
                    </span>

                    {/* Item Name */}
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, "name", e.target.value)}
                      className="h-8 text-xs flex-1 min-w-[130px]"
                    />

                    {/* Qty */}
                    <div className="w-16 shrink-0">
                      <Input
                        type="number"
                        min="0.1"
                        step="any"
                        placeholder="Qty"
                        value={item.quantity || ""}
                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                        className="h-8 text-xs text-center"
                      />
                    </div>

                    {/* Unit */}
                    <div className="w-16 shrink-0">
                      <Input
                        placeholder="Unit"
                        value={item.unit || "pcs"}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="h-8 text-xs text-center"
                      />
                    </div>

                    {/* Price per unit (£) */}
                    <div className="relative w-24 shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                        £
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price || ""}
                        onChange={(e) => handleItemChange(index, "price", e.target.value)}
                        className="h-8 text-xs pl-5 text-right font-mono"
                      />
                    </div>

                    {/* Total item preview */}
                    <div className="w-20 text-right shrink-0">
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                        {formatMoney(Number(item.total) || 0)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Table Footer Summary */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/80 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-500">
                Sum of Items:{" "}
                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">
                  {formatMoney(calculatedItemsTotal)}
                </strong>
                <span className="text-zinc-400 ml-1">
                  (≈ {formatINR(calculatedItemsTotal, gbpRate)})
                </span>
              </span>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Expense Recorded:</span>
                <strong className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatMoney(expense.amount)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-row items-center justify-between sm:justify-between">
          <div>
            {isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditableItems(parseShoppingItemsFromExpense(expense));
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="text-xs"
              >
                Cancel Edit
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs border-zinc-300 dark:border-zinc-700"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1.5 text-zinc-500" />
                Edit Items
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? "Saving..." : "Save Item Prices"}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Close
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
