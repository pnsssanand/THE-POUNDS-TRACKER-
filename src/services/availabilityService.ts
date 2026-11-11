import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { getDb } from "./firebase";
import type { DayOfWeek, TimeSlot, WeeklyAvailability, TodoTask } from "@/types";

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailability = {
  Monday: [{ id: "mon-1", start: "10:00", end: "12:00" }], // 2h
  Tuesday: [{ id: "tue-1", start: "15:00", end: "20:00" }], // 5h
  Wednesday: [{ id: "wed-1", start: "14:00", end: "20:00" }], // 6h
  Thursday: [
    { id: "thu-1", start: "09:00", end: "13:00" }, // 4h
    { id: "thu-2", start: "15:00", end: "20:00" }, // 5h
  ], // Total: 9h
  Friday: [{ id: "fri-1", start: "16:00", end: "20:00" }], // 4h
  Saturday: [{ id: "sat-1", start: "17:00", end: "20:00" }], // 3h
  Sunday: [{ id: "sun-1", start: "17:00", end: "20:00" }], // 3h
};

/** Convert "HH:mm" to total minutes from midnight */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Convert total minutes from midnight to "HH:mm" */
export function minutesToTime(totalMinutes: number): string {
  const norm = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Format 24h "HH:mm" to 12h UK readable string e.g. "10:00 AM", "3:00 PM" */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}

/** Format a time slot into a user-friendly label e.g. "10:00 AM – 12:00 PM (2h)" */
export function formatSlotLabel(start: string, end: string): string {
  const diffHours = calculateSlotHours(start, end);
  const hourText = diffHours === 1 ? "1 hour" : `${diffHours} hours`;
  return `${formatTime12h(start)} – ${formatTime12h(end)} (${hourText})`;
}

/** Calculate duration in hours between two HH:mm times */
export function calculateSlotHours(start: string, end: string): number {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (endMin <= startMin) return 0;
  const diff = (endMin - startMin) / 60;
  return Math.round(diff * 100) / 100;
}

/** Calculate available hours for a given day's slots */
export function calculateDayAvailableHours(slots: TimeSlot[]): number {
  if (!slots || !Array.isArray(slots)) return 0;
  const total = slots.reduce((acc, slot) => acc + calculateSlotHours(slot.start, slot.end), 0);
  return Math.round(total * 100) / 100;
}

/** Calculate total weekly available hours across all 7 days */
export function calculateTotalWeeklyAvailableHours(availability: WeeklyAvailability): number {
  if (!availability) return 32;
  let total = 0;
  for (const day of DAYS_OF_WEEK) {
    total += calculateDayAvailableHours(availability[day] || []);
  }
  return Math.round(total * 100) / 100;
}

/** Get DayOfWeek from YYYY-MM-DD date string */
export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday ...
  const map: Record<number, DayOfWeek> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };
  return map[dayIndex] || "Monday";
}

/** Check if a requested start and end time falls strictly within configured available slots */
export function isTimeSlotWithinAvailability(
  startTime: string,
  endTime: string,
  slots: TimeSlot[]
): boolean {
  if (!startTime || !endTime || !slots || slots.length === 0) return false;
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  if (startMin >= endMin) return false;

  return slots.some((slot) => {
    const slotStartMin = timeToMinutes(slot.start);
    const slotEndMin = timeToMinutes(slot.end);
    return startMin >= slotStartMin && endMin <= slotEndMin;
  });
}

/** Find any existing tasks on the same date that overlap with the proposed start and end time */
export function findConflictingTasks(
  tasks: TodoTask[],
  date: string,
  startTime: string,
  endTime: string,
  currentTaskId?: string
): TodoTask[] {
  if (!date || !startTime || !endTime) return [];
  const reqStart = timeToMinutes(startTime);
  const reqEnd = timeToMinutes(endTime);
  if (reqStart >= reqEnd) return [];

  return tasks.filter((t) => {
    if (t.id === currentTaskId) return false;
    if (t.dueDate !== date) return false;
    if (!t.startTime || !t.endTime) return false;
    const taskStart = timeToMinutes(t.startTime);
    const taskEnd = timeToMinutes(t.endTime);
    // Overlap exists if max(start1, start2) < min(end1, end2)
    return Math.max(reqStart, taskStart) < Math.min(reqEnd, taskEnd);
  });
}

export interface FreeSlot {
  start: string;
  end: string;
  hours: number;
}

/**
 * Calculate remaining free time slots within the day's available windows
 * by subtracting any scheduled task intervals.
 */
export function getRemainingFreeSlots(
  slotsForDay: TimeSlot[],
  tasksForDate: TodoTask[]
): FreeSlot[] {
  if (!slotsForDay || slotsForDay.length === 0) return [];

  // Filter tasks with valid times on this date (only scheduled tasks consume availability)
  const taskIntervals = tasksForDate
    .filter((t) => t.status === "scheduled" && t.startTime && t.endTime)
    .map((t) => ({
      start: timeToMinutes(t.startTime!),
      end: timeToMinutes(t.endTime!),
    }))
    .filter((inv) => inv.start < inv.end)
    .sort((a, b) => a.start - b.start);

  const freeSlots: FreeSlot[] = [];

  for (const slot of slotsForDay) {
    let currentIntervals: Array<{ start: number; end: number }> = [
      { start: timeToMinutes(slot.start), end: timeToMinutes(slot.end) },
    ];

    for (const task of taskIntervals) {
      const nextIntervals: Array<{ start: number; end: number }> = [];

      for (const cur of currentIntervals) {
        // No overlap
        if (task.end <= cur.start || task.start >= cur.end) {
          nextIntervals.push(cur);
        } else {
          // Overlap: subtract task from interval
          if (task.start > cur.start) {
            nextIntervals.push({ start: cur.start, end: task.start });
          }
          if (task.end < cur.end) {
            nextIntervals.push({ start: task.end, end: cur.end });
          }
        }
      }
      currentIntervals = nextIntervals;
    }

    for (const free of currentIntervals) {
      if (free.end > free.start) {
        const startStr = minutesToTime(free.start);
        const endStr = minutesToTime(free.end);
        const hours = calculateSlotHours(startStr, endStr);
        if (hours > 0) {
          freeSlots.push({ start: startStr, end: endStr, hours });
        }
      }
    }
  }

  return freeSlots;
}

export interface WeekDayInfo {
  dayName: DayOfWeek;
  dateStr: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "16 Nov"
  isToday: boolean;
}

/**
 * Get 7 days for the week containing referenceDateStr (or current UK date),
 * from Monday to Sunday.
 */
export function getUKWeekDays(referenceDateStr?: string): {
  startOfWeekISO: string;
  endOfWeekISO: string;
  days: WeekDayInfo[];
} {
  let refDate: Date;
  if (referenceDateStr) {
    const [y, m, d] = referenceDateStr.split("-").map(Number);
    refDate = new Date(y, m - 1, d);
  } else {
    refDate = new Date();
  }

  const dayOfWeek = refDate.getDay(); // 0 is Sunday, 1 is Monday ...
  // Diff to get to Monday of this week:
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(refDate);
  monday.setDate(refDate.getDate() + diffToMonday);

  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  const days: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);

    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const formattedDate = cur.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });

    const dayName = DAYS_OF_WEEK[i];

    days.push({
      dayName,
      dateStr,
      formattedDate,
      isToday: dateStr === todayStr,
    });
  }

  return {
    startOfWeekISO: days[0].dateStr,
    endOfWeekISO: days[6].dateStr,
    days,
  };
}

/** Helper to shift a date by N weeks */
export function shiftWeekDate(referenceDateStr: string, weeksDiff: number): string {
  const [y, m, d] = referenceDateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + weeksDiff * 7);
  const ry = date.getFullYear();
  const rm = String(date.getMonth() + 1).padStart(2, "0");
  const rd = String(date.getDate()).padStart(2, "0");
  return `${ry}-${rm}-${rd}`;
}

/**
 * Format live Greenwich Mean Time (GMT) in 12-hour format with hours, minutes, seconds
 * e.g. "11:15:22 PM"
 */
export function formatGMTLiveTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "GMT",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
    .format(date)
    .toUpperCase();
}

/** Get GMT date ISO string (YYYY-MM-DD) and current minutes from midnight */
export function getGMTDateParts(d: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "GMT",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "0";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = parseInt(get("hour"), 10);
  const minute = parseInt(get("minute"), 10);
  const second = parseInt(get("second"), 10);
  const dateISO = `${year}-${month}-${day}`;
  const minutesFromMidnight = hour * 60 + minute;
  return { dateISO, minutesFromMidnight, hour, minute, second };
}

export interface AdvancedWeeklyMetrics {
  totalWeeklyHours: number;
  scheduledHours: number;
  completedHours: number;
  remainingHoursToEndOfWeek: number;
  wastedHours: number;
  wastedPercentage: number;
  pastAvailableHours: number;
  futureAvailableHours: number;
  todayDayName: DayOfWeek;
}

/**
 * Calculates weekly hours considering past vs remaining days in the week:
 * - Hours on past days that were not scheduled/completed are counted as WASTED.
 * - Remaining hours only counts the free hours available from today onwards to end of week (Sunday).
 */
export function calculateAdvancedWeeklyMetrics(
  availability: WeeklyAvailability,
  tasks: TodoTask[],
  referenceDate: Date = new Date()
): AdvancedWeeklyMetrics {
  const { dateISO: todayISO, minutesFromMidnight: nowMinutes } = getGMTDateParts(referenceDate);
  const weekInfo = getUKWeekDays(todayISO);
  const todayDayName = getDayOfWeekFromDate(todayISO);

  const totalWeeklyHours = calculateTotalWeeklyAvailableHours(availability);

  let totalScheduledHours = 0;
  let totalCompletedHours = 0;
  let totalWastedHours = 0;
  let futureFreeAvailableHours = 0;
  let pastAvailableHours = 0;
  let futureTotalAvailable = 0;

  for (const day of weekInfo.days) {
    const daySlots = availability[day.dayName] || [];
    const dayAvail = calculateDayAvailableHours(daySlots);
    const dayTasks = tasks.filter((t) => t.dueDate === day.dateStr);

    const scheduledTasksDay = dayTasks.filter((t) => t.status === "scheduled");
    const completedTasksDay = dayTasks.filter((t) => t.status === "completed");

    const dayScheduled = scheduledTasksDay.reduce((acc, t) => {
      return acc + (t.startTime && t.endTime ? calculateSlotHours(t.startTime, t.endTime) : 1);
    }, 0);

    const dayCompleted = completedTasksDay.reduce((acc, t) => {
      return acc + (t.startTime && t.endTime ? calculateSlotHours(t.startTime, t.endTime) : 1);
    }, 0);

    totalScheduledHours += dayScheduled;
    totalCompletedHours += dayCompleted;

    if (day.dateStr < todayISO) {
      // Past day: all hours on this day have passed
      pastAvailableHours += dayAvail;
      const dayUtilized = dayScheduled + dayCompleted;
      const wasted = Math.max(0, dayAvail - dayUtilized);
      totalWastedHours += wasted;
    } else if (day.dateStr > todayISO) {
      // Future day: all hours are upcoming
      futureTotalAvailable += dayAvail;
      const free = Math.max(0, dayAvail - dayScheduled);
      futureFreeAvailableHours += free;
    } else {
      // Today: evaluate slot by slot based on current GMT time
      for (const slot of daySlots) {
        const slotStartMin = timeToMinutes(slot.start);
        const slotEndMin = timeToMinutes(slot.end);
        const slotHours = calculateSlotHours(slot.start, slot.end);

        const tasksInSlot = dayTasks.filter((t) => {
          if (!t.startTime || !t.endTime) return true;
          const tStart = timeToMinutes(t.startTime);
          const tEnd = timeToMinutes(t.endTime);
          return Math.max(slotStartMin, tStart) < Math.min(slotEndMin, tEnd);
        });

        const tasksInSlotHours = tasksInSlot.reduce((acc, t) => {
          if (t.startTime && t.endTime) {
            const tStart = Math.max(slotStartMin, timeToMinutes(t.startTime));
            const tEnd = Math.min(slotEndMin, timeToMinutes(t.endTime));
            return acc + Math.max(0, (tEnd - tStart) / 60);
          }
          return acc + 1;
        }, 0);

        if (nowMinutes >= slotEndMin) {
          // Slot has passed today
          pastAvailableHours += slotHours;
          const wasted = Math.max(0, slotHours - tasksInSlotHours);
          totalWastedHours += wasted;
        } else if (nowMinutes <= slotStartMin) {
          // Slot is upcoming today
          futureTotalAvailable += slotHours;
          const free = Math.max(0, slotHours - tasksInSlotHours);
          futureFreeAvailableHours += free;
        } else {
          // Current time is inside this slot
          const passedPortion = (nowMinutes - slotStartMin) / 60;
          const remainingPortion = (slotEndMin - nowMinutes) / 60;
          pastAvailableHours += passedPortion;
          futureTotalAvailable += remainingPortion;

          const passedTasksHours = tasksInSlot.reduce((acc, t) => {
            if (t.startTime && t.endTime) {
              const tStart = Math.max(slotStartMin, timeToMinutes(t.startTime));
              const tEnd = Math.min(nowMinutes, timeToMinutes(t.endTime));
              return acc + Math.max(0, (tEnd - tStart) / 60);
            }
            return acc;
          }, 0);

          const futureTasksHours = tasksInSlot.reduce((acc, t) => {
            if (t.startTime && t.endTime) {
              const tStart = Math.max(nowMinutes, timeToMinutes(t.startTime));
              const tEnd = Math.min(slotEndMin, timeToMinutes(t.endTime));
              return acc + Math.max(0, (tEnd - tStart) / 60);
            }
            return acc;
          }, 0);

          totalWastedHours += Math.max(0, passedPortion - passedTasksHours);
          futureFreeAvailableHours += Math.max(0, remainingPortion - futureTasksHours);
        }
      }
    }
  }

  const roundedScheduled = Math.round(totalScheduledHours * 10) / 10;
  const roundedCompleted = Math.round(totalCompletedHours * 10) / 10;
  const roundedWasted = Math.round(totalWastedHours * 10) / 10;
  const roundedRemaining = Math.round(futureFreeAvailableHours * 10) / 10;
  const roundedPastAvail = Math.round(pastAvailableHours * 10) / 10;
  const roundedFutureAvail = Math.round(futureTotalAvailable * 10) / 10;

  const wastedPercentage =
    roundedPastAvail > 0 ? Math.min(100, Math.round((roundedWasted / roundedPastAvail) * 100)) : 0;

  return {
    totalWeeklyHours,
    scheduledHours: roundedScheduled,
    completedHours: roundedCompleted,
    remainingHoursToEndOfWeek: roundedRemaining,
    wastedHours: roundedWasted,
    wastedPercentage,
    pastAvailableHours: roundedPastAvail,
    futureAvailableHours: roundedFutureAvail,
    todayDayName,
  };
}

export function subscribeWeeklyAvailability(
  uid: string,
  onData: (data: WeeklyAvailability) => void,
  onError: (err: unknown) => void
): () => void {
  const ref = doc(getDb(), "users", uid, "settings", "weeklyAvailability");
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_WEEKLY_AVAILABILITY);
        return;
      }
      const raw = snap.data();
      const result: WeeklyAvailability = { ...DEFAULT_WEEKLY_AVAILABILITY };
      for (const day of DAYS_OF_WEEK) {
        if (Array.isArray(raw[day])) {
          result[day] = raw[day];
        }
      }
      onData(result);
    },
    onError
  );
}

/**
 * Get weekly availability once from Firestore
 */
export async function getWeeklyAvailability(uid: string): Promise<WeeklyAvailability> {
  const snap = await getDoc(doc(getDb(), "users", uid, "settings", "weeklyAvailability"));
  if (!snap.exists()) {
    return { ...DEFAULT_WEEKLY_AVAILABILITY };
  }
  const raw = snap.data();
  const result: WeeklyAvailability = { ...DEFAULT_WEEKLY_AVAILABILITY };
  for (const day of DAYS_OF_WEEK) {
    if (Array.isArray(raw[day])) {
      result[day] = raw[day];
    }
  }
  return result;
}

/**
 * Save weekly availability to Firestore
 */
export async function saveWeeklyAvailability(
  uid: string,
  availability: WeeklyAvailability
): Promise<void> {
  await setDoc(doc(getDb(), "users", uid, "settings", "weeklyAvailability"), availability);
}

