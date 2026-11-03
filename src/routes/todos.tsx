import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  subscribeTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  clearCompletedTasks,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type TaskInput,
} from "../services/taskService";
import type { TodoTask, TaskPriority } from "../types";
import { formatDateUK, todayISO } from "../lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  Filter, 
  CheckCircle2, 
  Sparkles, 
  RotateCcw,
  ListTodo,
  CalendarDays,
  Flame,
  ArrowUpDown,
  X,
  Undo2
} from "lucide-react";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/todos")({
  component: TodoListPage,
});

function TodoListPage() {
  const { user } = useAuth();
  const uid = user?.uid;

  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "title">("dueDate");

  // Active tab state
  const [activeTab, setActiveTab] = useState<"scheduled" | "completed">("scheduled");

  // Inline Quick Add state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDate, setQuickDate] = useState(todayISO());
  const [quickPriority, setQuickPriority] = useState<TaskPriority>("medium");
  const [quickCategory, setQuickCategory] = useState("General");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Modal Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Undo state
  const [lastAction, setLastAction] = useState<{
    message: string;
    undo: () => Promise<void>;
  } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerUndoableAction = (message: string, undoFn: () => Promise<void>) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setLastAction({ message, undo: undoFn });
    undoTimerRef.current = setTimeout(() => {
      setLastAction(null);
    }, 10000);

    toast(message, {
      action: {
        label: "Undo",
        onClick: async () => {
          try {
            await undoFn();
            setLastAction(null);
            toast.success("Action undone!");
          } catch (e) {
            console.error("Failed to undo:", e);
            toast.error("Failed to undo");
          }
        },
      },
      duration: 8000,
    });
  };

  const handleExecuteUndo = async () => {
    if (!lastAction) return;
    try {
      await lastAction.undo();
      setLastAction(null);
      toast.success("Action undone!");
    } catch (err) {
      console.error("Failed to undo:", err);
      toast.error("Failed to undo action");
    }
  };

  const today = todayISO();

  // Firestore subscription
  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsubscribe = subscribeTasks(
      uid,
      (data) => {
        setTasks(data);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load tasks:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  // Task lists
  const scheduledTasks = useMemo(() => tasks.filter((t) => t.status === "scheduled"), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks]);

  // Statistics
  const overdueTasks = useMemo(
    () => scheduledTasks.filter((t) => t.dueDate < today),
    [scheduledTasks, today]
  );
  const todayTasks = useMemo(
    () => scheduledTasks.filter((t) => t.dueDate === today),
    [scheduledTasks, today]
  );
  const highPriorityTasks = useMemo(
    () => scheduledTasks.filter((t) => t.priority === "high"),
    [scheduledTasks]
  );

  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Filter & Sort helper
  const filterAndSortTasks = (list: TodoTask[]) => {
    return list
      .filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
        return matchesSearch && matchesCategory && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === "dueDate") {
          const dateDiff = a.dueDate.localeCompare(b.dueDate);
          if (dateDiff !== 0) return dateDiff;
          return (a.dueTime || "").localeCompare(b.dueTime || "");
        }
        if (sortBy === "priority") {
          const weights: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
          return weights[b.priority] - weights[a.priority];
        }
        return a.title.localeCompare(b.title);
      });
  };

  const filteredScheduled = useMemo(() => filterAndSortTasks(scheduledTasks), [scheduledTasks, searchTerm, categoryFilter, priorityFilter, sortBy]);
  const filteredCompleted = useMemo(() => {
    // For completed, default sort by completedAt descending or updated date
    return completedTasks
      .filter((task) => {
        const matchesSearch =
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === "all" || task.category === categoryFilter;
        const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
        return matchesSearch && matchesCategory && matchesPriority;
      })
      .sort((a, b) => (b.completedAt || b.dueDate).localeCompare(a.completedAt || a.dueDate));
  }, [completedTasks, searchTerm, categoryFilter, priorityFilter]);

  // Form Reset
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueDate(todayISO());
    setDueTime("");
    setPriority("medium");
    setCategory("General");
  };

  // Open Edit Dialog
  const handleEdit = (task: TodoTask) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || "");
    setPriority(task.priority);
    setCategory(task.category || "General");
    setIsDialogOpen(true);
  };

  // Submit Add / Edit Modal
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const input: TaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        dueTime: dueTime || undefined,
        priority,
        category,
        status: editingId ? (tasks.find((t) => t.id === editingId)?.status || "scheduled") : "scheduled",
      };

      if (editingId) {
        await updateTask(uid, editingId, input);
      } else {
        await addTask(uid, input);
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error("Failed to save task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inline Quick Add
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !quickTitle.trim()) return;

    setIsQuickAdding(true);
    try {
      await addTask(uid, {
        title: quickTitle.trim(),
        dueDate: quickDate,
        priority: quickPriority,
        category: quickCategory,
        status: "scheduled",
      });
      setQuickTitle("");
    } catch (err) {
      console.error("Failed to quick add task:", err);
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Toggle Complete / Scheduled with Undo
  const handleToggle = async (task: TodoTask) => {
    if (!uid) return;
    const wasScheduled = task.status === "scheduled";
    try {
      await toggleTaskComplete(uid, task);
      triggerUndoableAction(
        wasScheduled ? `Completed "${task.title}"` : `Restored "${task.title}" to scheduled`,
        async () => {
          await updateTask(uid, task.id, {
            status: wasScheduled ? "scheduled" : "completed",
            completedAt: wasScheduled ? undefined : task.completedAt || new Date().toISOString(),
          });
        }
      );
    } catch (err) {
      console.error("Failed to toggle task:", err);
      toast.error("Failed to update task");
    }
  };

  // Delete single task with Undo
  const handleDelete = async (taskOrId: TodoTask | string) => {
    if (!uid) return;
    const task = typeof taskOrId === "string" ? tasks.find((t) => t.id === taskOrId) : taskOrId;
    if (!task) return;
    const snapshot = { ...task };
    try {
      await deleteTask(uid, task.id);
      triggerUndoableAction(`Deleted task "${snapshot.title}"`, async () => {
        await addTask(uid, {
          title: snapshot.title,
          description: snapshot.description,
          dueDate: snapshot.dueDate,
          dueTime: snapshot.dueTime,
          priority: snapshot.priority,
          category: snapshot.category,
          status: snapshot.status,
          completedAt: snapshot.completedAt,
        });
      });
    } catch (err) {
      console.error("Failed to delete task:", err);
      toast.error("Failed to delete task");
    }
  };

  // Clear all completed tasks with Undo
  const handleClearCompleted = async () => {
    if (!uid || completedTasks.length === 0) return;
    const cleared = [...completedTasks];
    try {
      await clearCompletedTasks(uid, cleared);
      triggerUndoableAction(`Cleared ${cleared.length} completed tasks`, async () => {
        await Promise.all(
          cleared.map((t) =>
            addTask(uid, {
              title: t.title,
              description: t.description,
              dueDate: t.dueDate,
              dueTime: t.dueTime,
              priority: t.priority,
              category: t.category,
              status: "completed",
              completedAt: t.completedAt,
            })
          )
        );
      });
    } catch (err) {
      console.error("Failed to clear completed tasks:", err);
      toast.error("Failed to clear completed tasks");
    }
  };

  // Date badge helper
  const renderDateBadge = (task: TodoTask) => {
    const isOverdue = task.status === "scheduled" && task.dueDate < today;
    const isToday = task.dueDate === today;

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
          isOverdue
            ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800"
            : isToday
            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        )}
      >
        <Calendar className="w-3 h-3" />
        <span>{isToday ? "Today" : formatDateUK(task.dueDate)}</span>
        {task.dueTime && (
          <span className="opacity-80 flex items-center gap-0.5 ml-1">
            <Clock className="w-2.5 h-2.5" />
            {task.dueTime}
          </span>
        )}
        {isOverdue && <span className="font-bold ml-1">(Overdue)</span>}
      </span>
    );
  };

  // Priority badge helper
  const renderPriorityBadge = (p: TaskPriority) => {
    const config = TASK_PRIORITIES.find((item) => item.value === p) || TASK_PRIORITIES[1];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border",
          config.color
        )}
      >
        {p === "high" && <Flame className="w-3 h-3 text-red-500 fill-red-500" />}
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-bold tracking-tight">To-Do List</h1>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-zinc-500 mt-1">
            Organize your scheduled tasks and track your achievements.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(o) => {
              setIsDialogOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-1.5" />
                Schedule Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <form onSubmit={handleSubmitModal}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <ListTodo className="w-5 h-5 text-emerald-600" />
                    {editingId ? "Edit Scheduled Task" : "Add Scheduled Task"}
                  </DialogTitle>
                  <CardDescription>
                    Set task details, schedule due date/time, and priority level.
                  </CardDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="task-title">Task Title *</Label>
                    <Input
                      id="task-title"
                      placeholder="e.g. Pay utility bills or Submit timesheet"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="task-date">Due Date</Label>
                      <Input
                        id="task-date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-time">Due Time (Optional)</Label>
                      <Input
                        id="task-time"
                        type="time"
                        value={dueTime}
                        onChange={(e) => setDueTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Priority</Label>
                      <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority ⚡</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {TASK_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="task-desc">Description / Notes (Optional)</Label>
                    <Input
                      id="task-desc"
                      placeholder="Additional details, reference notes, links..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !title.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {isSubmitting ? "Saving..." : editingId ? "Update Task" : "Schedule Task"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Scheduled Tasks */}
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Scheduled Tasks</CardTitle>
            <Clock className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{scheduledTasks.length}</div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
              <span>{todayTasks.length} due today</span>
              {overdueTasks.length > 0 && (
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  · {overdueTasks.length} overdue
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Due Today & Overdue */}
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Due Today</CardTitle>
            <CalendarDays className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {todayTasks.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {overdueTasks.length > 0 ? (
                <span className="text-red-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {overdueTasks.length} past due date
                </span>
              ) : (
                "No overdue items"
              )}
            </p>
          </CardContent>
        </Card>

        {/* High Priority Tasks */}
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">High Priority</CardTitle>
            <Flame className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {highPriorityTasks.length}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Urgent attention needed</p>
          </CardContent>
        </Card>

        {/* Completed Tasks & Progress */}
        <Card className="shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500">Completed Tasks</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {completedTasks.length}
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                {completionRate}% finished
              </span>
            </div>
            <Progress value={completionRate} className="h-1.5 mt-2 bg-zinc-100 dark:bg-zinc-800" />
          </CardContent>
        </Card>
      </div>

      {/* Quick Add Bar */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-50/40 via-emerald-50/10 to-transparent dark:from-emerald-950/20 dark:via-emerald-950/5 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <form onSubmit={handleQuickAdd} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <Input
                placeholder="Quickly schedule a new task..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-36 h-10 bg-white dark:bg-zinc-900 text-xs shrink-0"
              />

              <Select value={quickPriority} onValueChange={(v: TaskPriority) => setQuickPriority(v)}>
                <SelectTrigger className="w-28 h-10 bg-white dark:bg-zinc-900 text-xs shrink-0">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High ⚡</SelectItem>
                </SelectContent>
              </Select>

              <Select value={quickCategory} onValueChange={setQuickCategory}>
                <SelectTrigger className="w-32 h-10 bg-white dark:bg-zinc-900 text-xs shrink-0">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="submit"
                disabled={isQuickAdding || !quickTitle.trim()}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Tabs (Scheduled vs Completed) */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "scheduled" | "completed")}
        className="w-full space-y-6"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid w-full sm:w-80 grid-cols-2 h-11 p-1 bg-zinc-100 dark:bg-zinc-800">
            <TabsTrigger value="scheduled" className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4" />
              <span>Scheduled</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold">
                {scheduledTasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-bold">
                {completedTasks.length}
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Search, Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TASK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-32 h-9 text-xs">
                <ArrowUpDown className="w-3 h-3 mr-1 opacity-70" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tab 1: Scheduled Tasks Content */}
        <TabsContent value="scheduled" className="mt-0 space-y-4">
          {loading ? (
            <div className="text-center py-16 text-zinc-500 animate-pulse">
              Loading scheduled tasks...
            </div>
          ) : filteredScheduled.length === 0 ? (
            <div className="text-center py-16 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">No scheduled tasks found</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                {searchTerm || categoryFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your search query or filters."
                  : "You're all caught up! Use the quick-add bar above or click 'Schedule Task' to add a new task."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredScheduled.map((task) => {
                const isOverdue = task.dueDate < today;
                const isToday = task.dueDate === today;

                return (
                  <Card
                    key={task.id}
                    className={cn(
                      "shadow-xs transition-all hover:shadow-md group",
                      isOverdue
                        ? "border-l-4 border-l-red-500 bg-red-50/10 dark:bg-red-950/10"
                        : isToday
                        ? "border-l-4 border-l-amber-500"
                        : "border-l-4 border-l-emerald-500"
                    )}
                  >
                    <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
                      {/* Checkbox Complete Button */}
                      <button
                        type="button"
                        onClick={() => handleToggle(task)}
                        className="mt-0.5 text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                        title="Mark as completed"
                      >
                        <Square className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">
                            {task.title}
                          </h4>
                          {renderPriorityBadge(task.priority)}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                            {task.category}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                          {renderDateBadge(task)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(task)}
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(task)}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Completed Tasks Content */}
        <TabsContent value="completed" className="mt-0 space-y-4">
          {completedTasks.length > 0 && (
            <div className="flex justify-between items-center px-1">
              <p className="text-xs text-zinc-500">
                Showing {filteredCompleted.length} completed task{filteredCompleted.length === 1 ? "" : "s"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCompleted}
                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear All Completed
              </Button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16 text-zinc-500 animate-pulse">
              Loading completed tasks...
            </div>
          ) : filteredCompleted.length === 0 ? (
            <div className="text-center py-16 px-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-lg">No completed tasks</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                Tasks you mark as done in the Scheduled tab will be archived and shown here.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredCompleted.map((task) => (
                <Card
                  key={task.id}
                  className="shadow-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 opacity-75 hover:opacity-100 transition-opacity"
                >
                  <CardContent className="p-4 sm:p-5 flex items-start gap-3.5">
                    {/* Uncheck / Restore Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className="mt-0.5 text-emerald-600 hover:text-zinc-500 dark:text-emerald-400 transition-colors shrink-0"
                      title="Restore to scheduled"
                    >
                      <CheckCircle2 className="w-5 h-5 fill-emerald-100 dark:fill-emerald-950" />
                    </button>

                    {/* Task Info (Strikethrough) */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-base line-through text-zinc-500 dark:text-zinc-400">
                          {task.title}
                        </h4>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                          {task.category}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-zinc-400 line-through whitespace-pre-wrap">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 pt-1">
                        <span>Due: {formatDateUK(task.dueDate)}</span>
                        {task.completedAt && (
                          <span>
                            · Finished on {new Date(task.completedAt).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(task)}
                        className="h-8 text-xs text-zinc-600 hover:text-emerald-600"
                        title="Restore to scheduled"
                      >
                        <Undo2 className="w-3.5 h-3.5 mr-1" />
                        Undo
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(task)}
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating Undo Banner */}
      {lastAction && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-8 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl shadow-2xl border border-zinc-700/50 dark:border-zinc-300">
            <RotateCcw className="w-4 h-4 text-emerald-400 dark:text-emerald-600 animate-spin-once" />
            <span className="text-sm font-medium">{lastAction.message}</span>
            <Button
              size="sm"
              onClick={handleExecuteUndo}
              className="h-7 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm"
            >
              Undo
            </Button>
            <button
              onClick={() => setLastAction(null)}
              className="text-zinc-400 hover:text-white dark:hover:text-zinc-900 p-0.5 ml-1"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
