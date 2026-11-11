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
} from "lucide-react";
import {
  getDayOfWeekFromDate,
  isTimeSlotWithinAvailability,
  findConflictingTasks,
  calculateSlotHours,
  formatTime12h,
  formatSlotLabel,
  timeToMinutes,
} from "../../services/availabilityService";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "../../services/taskService";
import type { TodoTask, TaskPriority, WeeklyAvailability } from "@/types";
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
  const [startTime, setStartTime] = useState(defaultStartTime || "");
  const [endTime, setEndTime] = useState(defaultEndTime || "");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState("General");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derive day of week from current date selection
  const dayOfWeek = useMemo(() => getDayOfWeekFromDate(date), [date]);
  const availableSlotsForDay = useMemo(
    () => availability[dayOfWeek] || [],
    [availability, dayOfWeek]
  );

  // Initialize or reset form when dialog opens or editingTask changes
  useEffect(() => {
    if (open) {
      if (editingTask) {
        setTitle(editingTask.title);
        setDescription(editingTask.description || "");
        setDate(editingTask.dueDate);
        setStartTime(editingTask.startTime || editingTask.dueTime || "");
        setEndTime(editingTask.endTime || "");
        setPriority(editingTask.priority);
        setCategory(editingTask.category || "General");
      } else {
        const initialDate = defaultDate || todayISO();
        setDate(initialDate);
        const day = getDayOfWeekFromDate(initialDate);
        const slots = availability[day] || [];

        if (defaultStartTime && defaultEndTime) {
          setStartTime(defaultStartTime);
          setEndTime(defaultEndTime);
        } else if (slots.length > 0) {
          // Pre-fill with first slot or 1 hour within first slot
          const firstSlot = slots[0];
          setStartTime(firstSlot.start);
          const firstEndMin = Math.min(
            timeToMinutes(firstSlot.end),
            timeToMinutes(firstSlot.start) + 60
          );
          const endH = Math.floor(firstEndMin / 60);
          const endM = firstEndMin % 60;
          setEndTime(`${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`);
        } else {
          setStartTime("");
          setEndTime("");
        }

        setTitle("");
        setDescription("");
        setPriority("medium");
        setCategory("General");
      }
      setSelectedSlotIndex(null);
    }
  }, [open, editingTask, defaultDate, defaultStartTime, defaultEndTime, availability]);

  // When date changes (and user didn't pre-fill custom start/end), suggest available slot
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const newDay = getDayOfWeekFromDate(newDate);
    const slots = availability[newDay] || [];
    if (slots.length > 0) {
      const slot = slots[0];
      setStartTime(slot.start);
      const endMin = Math.min(timeToMinutes(slot.end), timeToMinutes(slot.start) + 60);
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      setEndTime(`${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`);
      setSelectedSlotIndex(0);
    } else {
      setStartTime("");
      setEndTime("");
      setSelectedSlotIndex(null);
    }
  };

  // Choose an available slot preset
  const handleSelectSlot = (idx: number) => {
    setSelectedSlotIndex(idx);
    const slot = availableSlotsForDay[idx];
    if (slot) {
      setStartTime(slot.start);
      setEndTime(slot.end);
    }
  };

  // Validations
  const durationHours = useMemo(
    () => calculateSlotHours(startTime, endTime),
    [startTime, endTime]
  );

  const isTimeOrderValid = useMemo(() => {
    if (!startTime || !endTime) return true;
    return timeToMinutes(startTime) < timeToMinutes(endTime);
  }, [startTime, endTime]);

  const isWithinAvailability = useMemo(() => {
    if (!startTime || !endTime) return false;
    return isTimeSlotWithinAvailability(startTime, endTime, availableSlotsForDay);
  }, [startTime, endTime, availableSlotsForDay]);

  const conflictingTasks = useMemo(() => {
    if (!date || !startTime || !endTime || !isTimeOrderValid) return [];
    return findConflictingTasks(allTasks, date, startTime, endTime, editingTask?.id);
  }, [allTasks, date, startTime, endTime, isTimeOrderValid, editingTask]);

  const hasConflicts = conflictingTasks.length > 0;

  // Form validity check
  const isFormValid =
    title.trim().length > 0 &&
    date.length > 0 &&
    startTime.length > 0 &&
    endTime.length > 0 &&
    isTimeOrderValid &&
    isWithinAvailability &&
    !hasConflicts &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: date,
        dueTime: startTime,
        startTime,
        endTime,
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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
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
                  Schedule tasks exclusively within your configured weekly available hours.
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

            {/* Available Time Slots for this day */}
            <div className="space-y-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Available Hours on {dayOfWeek}:
                </span>
                {availableSlotsForDay.length === 0 && (
                  <span className="text-amber-600 dark:text-amber-400 font-normal">
                    No slots configured
                  </span>
                )}
              </div>

              {availableSlotsForDay.length === 0 ? (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    You have no available hours scheduled on <strong>{dayOfWeek}</strong>. Please
                    configure slots in <strong>My Availability</strong> or pick another date.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] text-zinc-500">
                    Click a slot to quickly set start and end time:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSlotsForDay.map((slot, idx) => (
                      <button
                        type="button"
                        key={slot.id || idx}
                        onClick={() => handleSelectSlot(idx)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                          selectedSlotIndex === idx
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500"
                        }`}
                      >
                        {formatSlotLabel(slot.start, slot.end)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Start and End Time inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="sched-start" className="text-xs font-semibold">
                  Start Time *
                </Label>
                <Input
                  id="sched-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setSelectedSlotIndex(null);
                  }}
                  required
                  className="h-9 text-sm font-mono"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="sched-end" className="text-xs font-semibold">
                  End Time *
                </Label>
                <Input
                  id="sched-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setSelectedSlotIndex(null);
                  }}
                  required
                  className="h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* Duration and Validation Alerts */}
            {startTime && endTime && (
              <div className="space-y-2">
                {/* Duration Tag */}
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-zinc-500">Calculated Task Duration:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {durationHours > 0
                      ? `${durationHours} ${durationHours === 1 ? "hour" : "hours"} (${formatTime12h(startTime)} – ${formatTime12h(endTime)})`
                      : "Invalid time range"}
                  </span>
                </div>

                {/* Time order validation */}
                {!isTimeOrderValid && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Start time must be earlier than End time.</span>
                  </div>
                )}

                {/* Outside availability alert */}
                {isTimeOrderValid && !isWithinAvailability && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Outside available hours:</strong> {formatTime12h(startTime)} –{" "}
                      {formatTime12h(endTime)} must fall strictly within your configured available
                      window for {dayOfWeek} (
                      {availableSlotsForDay.length > 0
                        ? availableSlotsForDay
                            .map((s) => `${formatTime12h(s.start)}–${formatTime12h(s.end)}`)
                            .join(", ")
                        : "No available hours"}
                      ).
                    </div>
                  </div>
                )}

                {/* Conflict Alert */}
                {hasConflicts && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Scheduling Conflict:</strong> This time overlaps with an existing
                      task on this date:{" "}
                      <span className="font-semibold">"{conflictingTasks[0].title}"</span> (
                      {formatTime12h(conflictingTasks[0].startTime!)} –{" "}
                      {formatTime12h(conflictingTasks[0].endTime!)}). Please choose a different
                      time.
                    </div>
                  </div>
                )}
              </div>
            )}

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

