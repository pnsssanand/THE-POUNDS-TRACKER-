import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  subscribeShoppingItems,
  addShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  SHOPPING_CATEGORIES,
  SHOPPING_UNITS,
} from "../services/shoppingService";
import { addExpense } from "../services/expenseService";
import { getSettings, updateSettings } from "../services/userService";
import type { ShoppingItem, UserSettings } from "../types";
import { formatMoney, formatINR } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Progress } from "../components/ui/progress";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Edit2, 
  CheckCircle2, 
  Minus, 
  ArrowRight, 
  Receipt, 
  Tag, 
  Store,
  CheckCheck,
  ShoppingBag
} from "lucide-react";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/shopping")({
  component: ShoppingPage,
});

export function ShoppingPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "bought">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Quick Add State
  const [quickName, setQuickName] = useState("");
  const [quickPrice, setQuickPrice] = useState("");

  // Dialog State (Add/Edit)
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState<string>("pcs");
  const [category, setCategory] = useState<string>("Groceries");
  const [store, setStore] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout to Expense Dialog State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPurpose, setCheckoutPurpose] = useState("Shopping run");
  const [checkoutCategory, setCheckoutCategory] = useState("Groceries");
  const [checkoutPaymentMode, setCheckoutPaymentMode] = useState<"cash" | "card">("card");
  const [checkoutBank, setCheckoutBank] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    if (!uid) return;

    getSettings(uid).then((s) => {
      setSettings(s);
      if (s?.preferredBank) setCheckoutBank(s.preferredBank);
      if (s?.preferredPaymentMode) setCheckoutPaymentMode(s.preferredPaymentMode);
    });

    const unsubscribe = subscribeShoppingItems(
      uid,
      (data) => {
        setItems(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error subscribing to shopping items:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  // Statistics
  const totalItems = items.length;
  const boughtItems = items.filter((i) => i.isBought);
  const pendingItems = items.filter((i) => !i.isBought);
  const boughtCount = boughtItems.length;

  const totalEstimatedCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  }, [items]);

  const inBasketCost = useMemo(() => {
    return boughtItems.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  }, [boughtItems]);

  const progressPercent = totalItems > 0 ? Math.round((boughtCount / totalItems) * 100) : 0;

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.store && item.store.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "bought" ? item.isBought : !item.isBought;

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [items, searchTerm, statusFilter, categoryFilter]);

  // Quick Add handler
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !quickName.trim()) return;

    try {
      await addShoppingItem(uid, {
        name: quickName.trim(),
        estimatedPrice: quickPrice ? parseFloat(quickPrice) : 0,
        quantity: 1,
        unit: "pcs",
        category: "Groceries",
        isBought: false,
      });
      setQuickName("");
      setQuickPrice("");
    } catch (err) {
      console.error("Failed to quick add item:", err);
    }
  };

  // Full Add/Edit Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !name.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedPrice = price ? parseFloat(price) : 0;
      const parsedQty = quantity ? Math.max(1, parseInt(quantity, 10)) : 1;

      const input = {
        name: name.trim(),
        estimatedPrice: isNaN(parsedPrice) ? 0 : parsedPrice,
        quantity: isNaN(parsedQty) ? 1 : parsedQty,
        unit: unit || "pcs",
        category: category || "Groceries",
        store: store.trim() || undefined,
        notes: notes.trim() || undefined,
        isBought: false,
      };

      if (editingId) {
        await updateShoppingItem(uid, editingId, input);
      } else {
        await addShoppingItem(uid, input);
      }

      setIsOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save shopping item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setQuantity("1");
    setUnit("pcs");
    setCategory("Groceries");
    setStore("");
    setNotes("");
  };

  const handleEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setName(item.name);
    setPrice(item.estimatedPrice ? item.estimatedPrice.toString() : "");
    setQuantity(item.quantity ? item.quantity.toString() : "1");
    setUnit(item.unit || "pcs");
    setCategory(item.category || "Groceries");
    setStore(item.store || "");
    setNotes(item.notes || "");
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!uid) return;
    try {
      await deleteShoppingItem(uid, id);
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleToggleBought = async (item: ShoppingItem) => {
    if (!uid) return;
    try {
      await updateShoppingItem(uid, item.id, { isBought: !item.isBought });
    } catch (err) {
      console.error("Failed to toggle item:", err);
    }
  };

  const handleUpdateQuantity = async (item: ShoppingItem, delta: number) => {
    if (!uid) return;
    const newQty = Math.max(1, (item.quantity || 1) + delta);
    try {
      await updateShoppingItem(uid, item.id, { quantity: newQty });
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  };

  const handleClearBought = async () => {
    if (!uid || boughtItems.length === 0) return;
    if (confirm(`Remove all ${boughtItems.length} purchased items from cart?`)) {
      try {
        await Promise.all(boughtItems.map((item) => deleteShoppingItem(uid, item.id)));
      } catch (err) {
        console.error("Failed to clear bought items:", err);
      }
    }
  };

  // Checkout to Expense handler
  const handleCheckoutToExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    // Use in-basket cost if items checked, otherwise total cart cost
    const costToCharge = inBasketCost > 0 ? inBasketCost : totalEstimatedCost;
    if (costToCharge <= 0) {
      alert("Cart total is £0.00. Please add prices to items before checking out.");
      return;
    }

    setIsCheckingOut(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const itemsList = (inBasketCost > 0 ? boughtItems : items)
        .map((i) => `${i.name} (x${i.quantity || 1})`)
        .join(", ");

      // 1. Add expense
      await addExpense(uid, {
        purpose: checkoutPurpose || "Shopping Cart Purchase",
        amount: costToCharge,
        date: today,
        category: (checkoutCategory as any) || "Groceries",
        paymentMode: checkoutPaymentMode,
        bankName: checkoutPaymentMode === "card" ? checkoutBank : undefined,
        notes: `Items: ${itemsList}`,
      });

      // 2. Subtract from Bank Balance
      const currentBal = settings?.bankBalance || 0;
      const newBal = currentBal - costToCharge;
      await updateSettings(uid, { bankBalance: newBal });
      setSettings((prev) => (prev ? { ...prev, bankBalance: newBal } : null));

      // 3. Delete or mark items
      const itemsToDelete = inBasketCost > 0 ? boughtItems : items;
      await Promise.all(itemsToDelete.map((i) => deleteShoppingItem(uid, i.id)));

      setIsCheckoutOpen(false);
    } catch (err) {
      console.error("Failed to checkout cart to expense:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">Shopping List</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              <ShoppingCart className="w-3.5 h-3.5" />
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="text-zinc-500 mt-1">
            Build your shopping cart, tick items as you shop, and check out to expenses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {boughtCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearBought}
              className="text-zinc-600 dark:text-zinc-300 hover:text-red-600 hover:border-red-300"
            >
              <CheckCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
              Clear Checked ({boughtCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const defaultStore = items[0]?.store || items[0]?.category || "Groceries";
              setCheckoutPurpose(`Shopping: ${defaultStore}`);
              setCheckoutCategory(items[0]?.category || "Groceries");
              setIsCheckoutOpen(true);
            }}
            disabled={totalItems === 0}
            className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Receipt className="w-4 h-4 mr-1.5 text-emerald-600" />
            Checkout to Expenses
          </Button>

          <Dialog
            open={isOpen}
            onOpenChange={(o) => {
              setIsOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-1.5" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <form onSubmit={handleFormSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Shopping Item" : "Add to Shopping Cart"}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Basmati Rice, Milk, Eggs"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="item-price">Est. Price (£)</Label>
                      <Input
                        id="item-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="item-qty">Qty</Label>
                        <Input
                          id="item-qty"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="item-unit">Unit</Label>
                        <Select value={unit} onValueChange={setUnit}>
                          <SelectTrigger id="item-unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SHOPPING_UNITS.map((u) => (
                              <SelectItem key={u} value={u}>
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="item-category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="item-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHOPPING_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="item-store">Store (Optional)</Label>
                      <Input
                        id="item-store"
                        value={store}
                        onChange={(e) => setStore(e.target.value)}
                        placeholder="e.g. Tesco, Costco"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="item-notes">Notes (Optional)</Label>
                    <Input
                      id="item-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. 2 for £3 offer"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Add to Cart"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cart Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-emerald-500/20 bg-gradient-to-br from-white to-emerald-50/30 dark:from-zinc-900 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cart Total</CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {formatMoney(totalEstimatedCost)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              ≈ {formatINR(totalEstimatedCost)}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In-Basket Spend</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatMoney(inBasketCost)}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {boughtCount} of {totalItems} items picked
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining to Buy</CardTitle>
            <Tag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {formatMoney(Math.max(0, totalEstimatedCost - inBasketCost))}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {pendingItems.length} items left
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cart Progress</CardTitle>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {progressPercent}%
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold tracking-tight">
              {boughtCount}/{totalItems}
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Bar */}
      <Card className="shadow-sm border-dashed border-2 hover:border-emerald-500/50 transition-colors">
        <CardContent className="p-4">
          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="Quick add item (e.g. Tomatoes, Bread, Oats)..."
                className="pl-9 pr-4 h-10 w-full"
              />
            </div>
            <div className="relative w-full sm:w-[130px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-bold">
                £
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={quickPrice}
                onChange={(e) => setQuickPrice(e.target.value)}
                placeholder="Price"
                className="pl-7 pr-3 h-10 w-full"
              />
            </div>
            <Button
              type="submit"
              disabled={!quickName.trim()}
              className="w-full sm:w-auto h-10 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Drop in Cart
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Cart Items List */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <CardTitle>Items in Cart</CardTitle>
              <span className="text-xs text-zinc-500 font-normal">
                ({filteredItems.length} {filteredItems.length === 1 ? "item" : "items"})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search cart items..."
                  className="pl-9 w-full sm:w-[200px] h-9 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-50 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                    statusFilter === "all"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  All ({totalItems})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                    statusFilter === "pending"
                      ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  To Buy ({pendingItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("bought")}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                    statusFilter === "bought"
                      ? "bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  In Cart ({boughtCount})
                </button>
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <Filter className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {SHOPPING_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 text-zinc-500 animate-pulse">
              Loading your shopping cart...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <ShoppingCart className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-zinc-700 dark:text-zinc-300">
                {items.length === 0 ? "Your shopping cart is empty" : "No items match your filter"}
              </h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto mt-1">
                {items.length === 0
                  ? "Use the quick add bar above or click 'Add Item' to start building your shopping list."
                  : "Try clearing search or filters to see all cart items."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredItems.map((item) => {
                const itemTotal = (item.estimatedPrice || 0) * (item.quantity || 1);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-4 sm:px-6 transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40",
                      item.isBought && "bg-emerald-50/30 dark:bg-emerald-950/10"
                    )}
                  >
                    {/* Left: Checkbox & Item Info */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-2">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={item.isBought}
                        onCheckedChange={() => handleToggleBought(item)}
                        className="w-5 h-5 rounded-md data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 cursor-pointer"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={`item-${item.id}`}
                            className={cn(
                              "font-semibold text-sm cursor-pointer select-none transition-all",
                              item.isBought
                                ? "line-through text-zinc-400 dark:text-zinc-500"
                                : "text-zinc-900 dark:text-zinc-100"
                            )}
                          >
                            {item.name}
                          </label>

                          {item.category && (
                            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              {item.category}
                            </span>
                          )}

                          {item.store && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              <Store className="w-3 h-3" />
                              {item.store}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p className="text-xs text-zinc-400 mt-0.5 truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Middle: Quantity Adjuster (Cart-style) */}
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1 mr-4 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 transition-colors"
                        disabled={item.quantity <= 1}
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center select-none">
                        {item.quantity || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      {item.unit && item.unit !== "pcs" && (
                        <span className="text-[10px] text-zinc-400 pr-1">
                          {item.unit}
                        </span>
                      )}
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className={cn(
                          "font-bold text-sm",
                          item.isBought ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100"
                        )}>
                          {formatMoney(itemTotal)}
                        </div>
                        {item.quantity > 1 && item.estimatedPrice > 0 && (
                          <div className="text-[10px] text-zinc-400">
                            {formatMoney(item.estimatedPrice)} ea
                          </div>
                        )}
                      </div>

                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Edit item"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Remove from cart"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Checkout to Expenses Modal */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCheckoutToExpense}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Checkout to Expenses
              </DialogTitle>
              <CardDescription>
                Convert your shopping cart spend into an Expense and deduct from Bank Balance.
              </CardDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-500 block">
                    {inBasketCost > 0 ? "In-Basket Items Total" : "Entire Cart Total"}
                  </span>
                  <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatMoney(inBasketCost > 0 ? inBasketCost : totalEstimatedCost)}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {inBasketCost > 0 ? `${boughtCount} checked items` : `${totalItems} items`}
                </span>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="checkout-purpose">Expense Purpose</Label>
                <Input
                  id="checkout-purpose"
                  value={checkoutPurpose}
                  onChange={(e) => setCheckoutPurpose(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="checkout-cat">Category</Label>
                  <Select value={checkoutCategory} onValueChange={setCheckoutCategory}>
                    <SelectTrigger id="checkout-cat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Indian Store">Indian Store</SelectItem>
                      <SelectItem value="Groceries">Groceries</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Food">Food</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="checkout-mode">Payment Method</Label>
                  <Select
                    value={checkoutPaymentMode}
                    onValueChange={(v: any) => setCheckoutPaymentMode(v)}
                  >
                    <SelectTrigger id="checkout-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {checkoutPaymentMode === "card" && (
                <div className="grid gap-2">
                  <Label htmlFor="checkout-bank">Bank Name</Label>
                  <Input
                    id="checkout-bank"
                    value={checkoutBank}
                    onChange={(e) => setCheckoutBank(e.target.value)}
                    placeholder="e.g. Monzo, HSBC"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCheckoutOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCheckingOut}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCheckingOut ? "Recording..." : "Confirm & Save Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
