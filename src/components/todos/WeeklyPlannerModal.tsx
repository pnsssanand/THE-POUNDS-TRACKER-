import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  Square,
  Edit2,
  Trash2,
  Sparkles,
  Flame,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  getUKWeekDays,
  shiftWeekDate,
  getRemainingFreeSlots,
  calculateDayAvailableHours,
  calculateTotalWeeklyAvailableHours,
  formatSlotLabel,
  formatTime12h,
  calculateSlotHours,
  formatGMTLiveTime,
  calculateAdvancedWeeklyMetrics,
  getGMTDateParts,
} from "../../services/availabilityService";
import { TASK_PRIORITIES } from "../../services/taskService";
import type { TodoTask, WeeklyAvailability, DayOfWeek } from "@/types";
import { cn } from "../../lib/utils";
import { todayISO } from "../../lib/format";

interface WeeklyPlannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availability: WeeklyAvailability;
  tasks: TodoTask[];
  onScheduleSlot: (date: string, startTime?: string, endTime?: string) => void;
  onEditTask: (task: TodoTask) => void;
  onToggleTask: (task: TodoTask) => void;
  onCompleteTaskRequest?: (task: TodoTask) => void;
  onViewCompletedTask?: (task: TodoTask) => void;
  onDeleteTask: (task: TodoTask) => void;
}

export function WeeklyPlannerModal({
  open,
  onOpenChange,
  availability,
  tasks,
  onScheduleSlot,
  onEditTask,
  onToggleTask,
  onCompleteTaskRequest,
  onViewCompletedTask,
  onDeleteTask,
}: WeeklyPlannerModalProps) {
  const [currentWeekRefDate, setCurrentWeekRefDate] = useState<string>(todayISO());
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [gmtClock, setGmtClock] = useState<string>(() => formatGMTLiveTime());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setGmtClock(formatGMTLiveTime(now));
      setCurrentTime(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const weekInfo = useMemo(
    () => getUKWeekDays(currentWeekRefDate),
    [currentWeekRefDate]
  );

  const { dateISO: gmtTodayStr } = useMemo(() => getGMTDateParts(currentTime), [currentTime]);

  const isCurrentWeek = useMemo(() => {
    return weekInfo.days.some((d) => d.dateStr === gmtTodayStr);
  }, [weekInfo, gmtTodayStr]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setCurrentWeekRefDate((prev) => shiftWeekDate(prev, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekRefDate((prev) => shiftWeekDate(prev, 1));
  };

  const handleResetCurrentWeek = () => {
    setCurrentWeekRefDate(todayISO());
  };

  // Calculate week tasks & advanced metrics (hourly real-time update)
  const weekTasks = useMemo(() => {
    const start = weekInfo.startOfWeekISO;
    const end = weekInfo.endOfWeekISO;
    return tasks.filter((t) => t.dueDate >= start && t.dueDate <= end);
  }, [tasks, weekInfo]);

  const advancedMetrics = useMemo(() => {
    return calculateAdvancedWeeklyMetrics(availability, tasks, currentTime);
  }, [availability, tasks, currentTime]);

  const scheduledWeekTasks = useMemo(
    () => weekTasks.filter((t) => t.status === "scheduled"),
    [weekTasks]
  );

  const completedWeekTasks = useMemo(
    () => weekTasks.filter((t) => t.status === "completed"),
    [weekTasks]
  );

  const totalAvailableHours = useMemo(
    () => calculateTotalWeeklyAvailableHours(availability),
    [availability]
  );

  const scheduledHours = useMemo(() => {
    const total = scheduledWeekTasks.reduce((acc, t) => {
      if (t.startTime && t.endTime) {
        return acc + calculateSlotHours(t.startTime, t.endTime);
      }
      return acc + 1; // Default fallback 1h if legacy
    }, 0);
    return Math.round(total * 100) / 100;
  }, [scheduledWeekTasks]);

  const completedHours = useMemo(() => {
    const total = completedWeekTasks.reduce((acc, t) => {
      if (t.startTime && t.endTime) {
        return acc + calculateSlotHours(t.startTime, t.endTime);
      }
      return acc + 1;
    }, 0);
    return Math.round(total * 100) / 100;
  }, [completedWeekTasks]);

  const remainingFreeHours = Math.max(
    0,
    Math.round((totalAvailableHours - scheduledHours - completedHours) * 100) / 100
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] xl:max-w-7xl h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <DialogHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Title & Description */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Weekly Planner
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500">
                    Review your weekly available time slots, scheduled tasks, and remaining free windows.
                  </DialogDescription>
                </div>
              </div>

              {/* Week Navigation & Summary Stats */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Navigation Buttons */}
                <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevWeek}
                    className="h-7 w-7 text-zinc-600 dark:text-zinc-300"
                    title="Previous week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-semibold px-2 min-w-[130px] text-center">
                    {weekInfo.days[0].formattedDate} – {weekInfo.days[6].formattedDate}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextWeek}
                    className="h-7 w-7 text-zinc-600 dark:text-zinc-300"
                    title="Next week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {!isCurrentWeek && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetCurrentWeek}
                    className="h-8 text-xs font-medium"
                  >
                    This Week
                  </Button>
                )}

                {/* Live GMT Clock */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-xs font-semibold shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>GMT: {gmtClock}</span>
                </div>

                {/* Quick stats pills */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                    Available: <strong className="text-zinc-900 dark:text-zinc-100">{advancedMetrics.totalWeeklyHours}h</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800">
                    Scheduled: <strong>{advancedMetrics.scheduledHours}h</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                    Completed: <strong>{advancedMetrics.completedHours}h</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800" title="Free hours remaining from today to end of week">
                    Remaining: <strong>{advancedMetrics.remainingHoursToEndOfWeek}h</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-medium border border-red-200 dark:border-red-800" title="Past available hours that went unscheduled">
                    Wasted: <strong>{advancedMetrics.wastedHours}h</strong>
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* 7-Day Columns Scroll Area */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-5 bg-zinc-50/50 dark:bg-zinc-950/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 min-w-[300px] lg:min-w-[1050px]">
            {weekInfo.days.map((day) => {
              const daySlots = availability[day.dayName] || [];
              const dayHours = calculateDayAvailableHours(daySlots);

              // Tasks on this specific day
              const dayTasks = weekTasks.filter((t) => t.dueDate === day.dateStr);
              const dayScheduled = dayTasks.filter((t) => t.status === "scheduled");
              const dayCompleted = dayTasks.filter((t) => t.status === "completed");

              // Remaining free slots
              const freeSlots = getRemainingFreeSlots(daySlots, dayTasks);

              return (
                <div
                  key={day.dateStr}
                  className={cn(
                    "flex flex-col rounded-xl border bg-white dark:bg-zinc-900 shadow-xs transition-all",
                    day.isToday
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-zinc-200 dark:border-zinc-800"
                  )}
                >
                  {/* Day Column Header */}
                  <div
                    className={cn(
                      "p-3 rounded-t-xl border-b",
                      day.isToday
                        ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {day.dayName.slice(0, 3)}
                      </span>
                      {day.isToday ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white uppercase tracking-wider">
                          Today
                        </span>
                      ) : day.dateStr < gmtTodayStr ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500 uppercase">
                          Past
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-zinc-500">
                      <span>{day.formattedDate}</span>
                      <span className="font-medium text-[11px] text-zinc-600 dark:text-zinc-400">
                        {dayHours > 0 ? `${dayHours}h window` : "Off"}
                      </span>
                    </div>
                  </div>

                  {/* Day Content Area */}
                  <div className="flex-1 p-3 space-y-3.5 text-xs overflow-y-auto max-h-[58vh]">
                    {/* Available Time Slots */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Available Hours
                      </span>
                      {daySlots.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 italic">No hours configured</p>
                      ) : (
                        <div className="space-y-1">
                          {daySlots.map((slot, idx) => (
                            <button
                              key={slot.id || idx}
                              type="button"
                              onClick={() =>
                                onScheduleSlot(day.dateStr, slot.start, slot.end)
                              }
                              title="Click to schedule task during this slot"
                              className="w-full text-left px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center justify-between group"
                            >
                              <span className="font-medium text-[11px]">
                                {formatTime12h(slot.start)} – {formatTime12h(slot.end)}
                              </span>
                              <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Scheduled Tasks */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                          Scheduled ({dayScheduled.length})
                        </span>
                      </div>

                      {dayScheduled.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 italic">No tasks scheduled</p>
                      ) : (
                        <div className="space-y-1.5">
                          {dayScheduled.map((task) => {
                            const pConfig =
                              TASK_PRIORITIES.find((p) => p.value === task.priority) ||
                              TASK_PRIORITIES[1];

                            return (
                              <div
                                key={task.id}
                                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-xs transition-shadow space-y-1"
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onCompleteTaskRequest
                                        ? onCompleteTaskRequest(task)
                                        : onToggleTask(task)
                                    }
                                    className="text-zinc-400 hover:text-emerald-600 transition-colors shrink-0 mt-0.5"
                                    title="Mark complete & record notes"
                                  >
                                    <Square className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="font-semibold text-xs leading-tight flex-1 text-zinc-900 dark:text-zinc-100">
                                    {task.title}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onEditTask(task)}
                                    className="text-zinc-400 hover:text-blue-500 transition-colors shrink-0"
                                    title="Edit task"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-1 text-[10px] pt-0.5">
                                  {task.timeSlotLabel ? (
                                    <span className="font-medium px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      {task.timeSlotLabel}
                                    </span>
                                  ) : task.startTime && task.endTime ? (
                                    <span className="font-medium px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      {formatTime12h(task.startTime)} – {formatTime12h(task.endTime)}
                                    </span>
                                  ) : (
                                    task.dueTime && (
                                      <span className="text-zinc-500">
                                        {task.dueTime}
                                      </span>
                                    )
                                  )}

                                  <span
                                    className={cn(
                                      "px-1 py-0.2 rounded text-[9px] font-bold uppercase",
                                      pConfig.color
                                    )}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Completed Tasks */}
                    {dayCompleted.length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Completed ({dayCompleted.length})
                        </span>
                        <div className="space-y-1">
                          {dayCompleted.map((task) => (
                            <div
                              key={task.id}
                              className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/40 text-[11px] flex items-center justify-between text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <button
                                  type="button"
                                  onClick={() => onToggleTask(task)}
                                  className="text-emerald-500 hover:text-zinc-400 shrink-0"
                                  title="Restore to scheduled"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <span
                                  onClick={() => onViewCompletedTask?.(task)}
                                  className="line-through truncate cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200"
                                  title="Click to view completion notes"
                                >
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {task.actualHours !== undefined ? (
                                  <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-1 py-0.2 rounded border border-emerald-300 dark:border-emerald-800">
                                    {task.actualHours}h
                                  </span>
                                ) : null}
                                {task.completionNotes && (
                                  <button
                                    type="button"
                                    onClick={() => onViewCompletedTask?.(task)}
                                    title="View completion notes"
                                    className="text-emerald-600 hover:text-emerald-700"
                                  >
                                    <FileText className="w-3 h-3" />
                                  </button>
                                )}
                                {task.startTime && (
                                  <span className="text-[9px] font-mono">
                                    {formatTime12h(task.startTime)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Remaining Free / Wasted Slots */}
                    <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        {day.dateStr < gmtTodayStr ? "Unused / Wasted Hours" : "Remaining Free Slots"}
                      </span>
                      {daySlots.length === 0 ? (
                        <p className="text-[11px] text-zinc-400 italic">No hours set</p>
                      ) : freeSlots.length === 0 ? (
                        <div className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[11px] font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Fully Booked!</span>
                        </div>
                      ) : day.dateStr < gmtTodayStr ? (
                        <div className="space-y-1">
                          {freeSlots.map((free, idx) => (
                            <div
                              key={idx}
                              className="p-1.5 rounded-lg border border-red-200/70 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[10px] flex items-center justify-between"
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate">
                                  Wasted: {formatTime12h(free.start)} – {formatTime12h(free.end)}
                                </span>
                              </div>
                              <span className="font-bold px-1 rounded bg-red-100 dark:bg-red-900/50 shrink-0 ml-1">
                                {free.hours}h lost
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {freeSlots.map((free, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                onScheduleSlot(day.dateStr, free.start, free.end)
                              }
                              className="w-full text-left p-1.5 rounded-lg border border-dashed border-emerald-400/60 dark:border-emerald-700/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors flex items-center justify-between group"
                              title="Click to schedule a task directly in this free slot"
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <Plus className="w-3 h-3 text-emerald-600 shrink-0 group-hover:scale-125 transition-transform" />
                                <span className="text-[10px] font-semibold truncate">
                                  Free: {formatTime12h(free.start)} – {formatTime12h(free.end)}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold px-1 rounded bg-emerald-200/60 dark:bg-emerald-800/60 shrink-0 ml-1">
                                {free.hours}h
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column Bottom Action: Add Task */}
                  <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-b-xl">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onScheduleSlot(day.dateStr)}
                      className="w-full h-7 text-xs text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 font-medium"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Schedule Task
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

