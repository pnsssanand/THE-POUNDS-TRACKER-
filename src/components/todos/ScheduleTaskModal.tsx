import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import {
  ListTodo,
  Calendar,
  Clock,
  AlertTriangle,
  Flame,
  Check,
  Sparkles,
  Info,
  Layers,
} from "lucide-react";
import {
  getDayOfWeekFromDate,
  calculateSlotHours,
  formatTime12h,
  formatSlotLabel,
} from "../../services/availabilityService";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "../../services/taskService";
import type { TodoTask, TaskPriority, WeeklyAvailability, TimeSlot } from "@/types";
import { formatDateUK, todayISO } from "../../lib/format";

interface ScheduleTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availability: WeeklyAvailability;
  allTasks: TodoTask[];
  editingTask: TodoTask | null;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSave: (taskData: {
    title: string;
    description?: string;
    dueDate: string;
    dueTime?: string;
    startTime?: string;
    endTime?: string;
    timeSlotId?: string;
    timeSlotLabel?: string;
    priority: TaskPriority;
    category: string;
    status?: "scheduled" | "completed";
  }) => Promise<void>;
}

export function ScheduleTaskModal({
  open,
  onOpenChange,
  availability,
  allTasks,
  editingTask,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onSave,
}: ScheduleTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate || todayISO());
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive day of week from date selection
  const dayOfWeek = useMemo(() => getDayOfWeekFromDate(date), [date]);
  const availableSlotsForDay = useMemo(
    () => availability[dayOfWeek] || [],
    [availability, dayOfWeek]
  );

  // Initialize form state
  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || "");
        setDate(editingTask.dueDate);
        setPriority(editingTask.priority);
        setCategory(editingTask.category || "General");

        const day = getDayOfWeekFromDate(editingTask.dueDate);
        const slots = availability[day] || [];
        // Match slot by id or matching start/end
        const matched = slots.find(
          (s) =>
            s.id === editingTask.timeSlotId ||
            (s.start === editingTask.startTime && s.end === editingTask.endTime)
        );
        if (matched) {
          setSelectedSlotId(matched.id);
        } else if (slots.length > 0) {
          setSelectedSlotId(slots[0].id);
        } else {
          setSelectedSlotId("");
        }
      } else {
        const initialDate = defaultDate || todayISO();
        setDate(initialDate);
        const day = getDayOfWeekFromDate(initialDate);
        const slots = availability[day] || [];

        // If pre-filled start/end passed, match slot
        if (defaultStartTime && defaultEndTime) {
          const matched = slots.find(
            (s) => s.start === defaultStartTime && s.end === defaultEndTime
          );
          if (matched) {
            setSelectedSlotId(matched.id);
          } else if (slots.length > 0) {
            setSelectedSlotId(slots[0].id);
          } else {
            setSelectedSlotId("");
          }
        } else if (slots.length > 0) {
          setSelectedSlotId(slots[0].id);
        } else {
          setSelectedSlotId("");
        }

        setTitle("");
        setDescription("");
        setPriority("medium");
        setCategory("General");
      }
    }
  }, [open, editingTask, defaultDate, defaultStartTime, defaultEndTime, availability]);

  // When date changes, automatically pick the first available slot for that day
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const newDay = getDayOfWeekFromDate(newDate);
    const slots = availability[newDay] || [];
    if (slots.length > 0) {
      setSelectedSlotId(slots[0].id);
    } else {
      setSelectedSlotId("");
    }
  };

  // Currently selected slot object
  const currentSlot: TimeSlot | undefined = useMemo(() => {
    return availableSlotsForDay.find((s) => s.id === selectedSlotId);
  }, [availableSlotsForDay, selectedSlotId]);

  // Count other tasks already scheduled in this time slot on this date
  const otherTasksInSameSlot = useMemo(() => {
    if (!currentSlot) return [];
    return allTasks.filter(
      (t) =>
        t.id !== editingTask?.id &&
        t.status === "scheduled" &&
        t.dueDate === date &&
        (t.timeSlotId === currentSlot.id ||
          (t.startTime === currentSlot.start && t.endTime === currentSlot.end))
    );
  }, [allTasks, editingTask, date, currentSlot]);

  // Form validity: needs Title, Date, and an Available Time Slot
  const isFormValid =
    title.trim().length > 0 &&
    date.length > 0 &&
    Boolean(currentSlot) &&
    availableSlotsForDay.length > 0 &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !currentSlot) return;

    setIsSubmitting(true);
    try {
      const slotLabel = formatSlotLabel(currentSlot.start, currentSlot.end);
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: date,
        dueTime: currentSlot.start,
        startTime: currentSlot.start,
        endTime: currentSlot.end,
        timeSlotId: currentSlot.id,
        timeSlotLabel: slotLabel,
        priority,
        category,
        status: editingTask ? editingTask.status : "scheduled",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save scheduled task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {editingTask ? "Edit Scheduled Task" : "Schedule Task"}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Select an available time slot and add tasks. Multiple tasks can share the same time slot.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-3.5 py-1">
            {/* Task Title */}
            <div className="grid gap-1.5">
              <Label htmlFor="sched-title" className="text-xs font-semibold">
                Task Name *
              </Label>
              <Input
                id="sched-title"
                placeholder="e.g. Learn Python or Practice Machine Learning"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
                className="h-9 text-sm"
              />
            </div>

            {/* Date selection & Day badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="sched-date" className="text-xs font-semibold">
                  Date *
                </Label>
                <Input
                  id="sched-date"
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold text-zinc-500">
                  Selected Day of Week
                </Label>
                <div className="h-9 px-3 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-between text-xs font-medium">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {dayOfWeek}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {availableSlotsForDay.length > 0
                      ? `${availableSlotsForDay.length} available slot${availableSlotsForDay.length === 1 ? "" : "s"}`
                      : "No availability"}
                  </span>
                </div>
              </div>
            </div>

            {/* Time Slot Selection (Replaces manual Start & End Time) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Select Available Time Slot *
                </span>
                {currentSlot && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                    {calculateSlotHours(currentSlot.start, currentSlot.end)} hrs window
                  </span>
                )}
              </div>

              {availableSlotsForDay.length === 0 ? (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    No availability scheduled on <strong>{dayOfWeek}</strong>. Configure your
                    hours in <strong>My Availability</strong> or select another date.
                  </span>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="grid gap-2">
                    {availableSlotsForDay.map((slot) => {
                      const isSelected = slot.id === selectedSlotId;
                      const hours = calculateSlotHours(slot.start, slot.end);
                      const tasksCount = allTasks.filter(
                        (t) =>
                          t.status === "scheduled" &&
                          t.dueDate === date &&
                          (t.timeSlotId === slot.id ||
                            (t.startTime === slot.start && t.endTime === slot.end))
                      ).length;

                      return (
                        <div
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-zinc-400 dark:border-zinc-600"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-semibold">
                              {formatTime12h(slot.start)} – {formatTime12h(slot.end)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {tasksCount > 0 && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                                <Layers className="w-3 h-3 text-zinc-500" />
                                {tasksCount} {tasksCount === 1 ? "task" : "tasks"}
                              </span>
                            )}
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-zinc-200/70 dark:bg-zinc-800"
                            >
                              {hours} {hours === 1 ? "hour" : "hours"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Informative message about multiple tasks */}
                  {otherTasksInSameSlot.length > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <Layers className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>
                        {otherTasksInSameSlot.length} other{" "}
                        {otherTasksInSameSlot.length === 1 ? "task is" : "tasks are"} scheduled in
                        this time slot. When you complete each task, you can enter the exact time
                        it took.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Priority & Category */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Priority</Label>
                <Select value={priority} onValueChange={(v: TaskPriority) => setPriority(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority ⚡</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-9 text-xs">
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

            {/* Description */}
            <div className="grid gap-1.5">
              <Label htmlFor="sched-desc" className="text-xs font-semibold">
                Description / Notes (Optional)
              </Label>
              <Input
                id="sched-desc"
                placeholder="Additional details, action items, or reference links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!isFormValid}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : editingTask
                ? "Update Scheduled Task"
                : "Save Scheduled Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
