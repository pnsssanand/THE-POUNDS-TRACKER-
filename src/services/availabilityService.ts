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

/** Helper to merge overlapping minute intervals [start, end] */
export function mergeIntervals(
  intervals: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    const last = merged[merged.length - 1];
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
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
 * Get 7 days for the week containing referenceDateStr (or current UK/GMT date),
 * from Monday to Sunday strictly calculated in GMT.
 * This guarantees that every Monday at 00:00:00 GMT, the week automatically advances and resets.
 */
export function getUKWeekDays(referenceDateStr?: string): {
  startOfWeekISO: string;
  endOfWeekISO: string;
  days: WeekDayInfo[];
} {
  let dateISO: string;
  if (referenceDateStr) {
    dateISO = referenceDateStr;
  } else {
    dateISO = getGMTDateParts(new Date()).dateISO;
  }

  // Parse YYYY-MM-DD
  const [y, m, d] = dateISO.split("-").map(Number);
  // Create UTC noon date to completely prevent timezone shift issues
  const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

  // In UTC: getUTCDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const utcDay = utcDate.getUTCDay();
  // Difference to get to Monday of this week:
  const diffToMonday = utcDay === 0 ? -6 : 1 - utcDay;

  const mondayUTC = new Date(utcDate);
  mondayUTC.setUTCDate(utcDate.getUTCDate() + diffToMonday);

  const todayGMTISO = getGMTDateParts(new Date()).dateISO;

  const days: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(mondayUTC);
    cur.setUTCDate(mondayUTC.getUTCDate() + i);

    const cy = cur.getUTCFullYear();
    const cm = String(cur.getUTCMonth() + 1).padStart(2, "0");
    const cd = String(cur.getUTCDate()).padStart(2, "0");
    const curISO = `${cy}-${cm}-${cd}`;

    const formattedDate = cur.toLocaleDateString("en-GB", {
      timeZone: "GMT",
      day: "numeric",
      month: "short",
    });

    const dayName = DAYS_OF_WEEK[i];

    days.push({
      dayName,
      dateStr: curISO,
      formattedDate,
      isToday: curISO === todayGMTISO,
    });
  }

  return {
    startOfWeekISO: days[0].dateStr,
    endOfWeekISO: days[6].dateStr,
    days,
  };
}

/** Helper to shift a date by N weeks in UTC */
export function shiftWeekDate(referenceDateStr: string, weeksDiff: number): string {
  const [y, m, d] = referenceDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + weeksDiff * 7);
  const ry = date.getUTCFullYear();
  const rm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const rd = String(date.getUTCDate()).padStart(2, "0");
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
 * - Updates continuously and hourly based on current Greenwich Mean Time (GMT).
 * - Hours on past days (or elapsed hours of today's slots) that went unscheduled are counted as WASTED.
 * - Remaining hours only counts the free hours available from right now to end of week (Sunday 23:59 GMT).
 * - Resets every Monday at 00:00:00 GMT automatically when the new week begins.
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

    // Completed tasks attributable to this day (matches completedAt date or dueDate)
    const dayCompletedTasks = tasks.filter((t) => {
      if (t.status !== "completed") return false;
      if (t.completedAt) {
        return t.completedAt.slice(0, 10) === day.dateStr;
      }
      return t.dueDate === day.dateStr;
    });

    // Scheduled tasks on this day
    const dayScheduledTasks = tasks.filter((t) => {
      if (t.status !== "scheduled") return false;
      return t.dueDate === day.dateStr;
    });

    // Scheduled hours: calculate based on unique time slots committed on this day
    const scheduledSlotKeys = new Set<string>();
    let dayScheduledUntimed = 0;
    for (const t of dayScheduledTasks) {
      if (t.startTime && t.endTime) {
        scheduledSlotKeys.add(`${t.startTime}-${t.endTime}`);
      } else {
        dayScheduledUntimed += 1;
      }
    }
    let dayScheduled = dayScheduledUntimed;
    for (const key of scheduledSlotKeys) {
      const [s, e] = key.split("-");
      dayScheduled += calculateSlotHours(s, e);
    }
    dayScheduled = Math.min(dayAvail, dayScheduled);

    // Completed hours: sum of actual time taken entered by user when completing tasks
    const dayCompleted = dayCompletedTasks.reduce((acc, t) => {
      if (t.actualHours !== undefined && t.actualHours > 0) {
        return acc + t.actualHours;
      }
      if (t.startTime && t.endTime) {
        return acc + calculateSlotHours(t.startTime, t.endTime);
      }
      return acc + 1;
    }, 0);

    totalScheduledHours += dayScheduled;
    totalCompletedHours += dayCompleted;

    if (day.dateStr < todayISO) {
      // Past day: the day is completely finished.
      // At the end of the day, any available hours not completed are put in WASTED HOURS!
      pastAvailableHours += dayAvail;
      const wasted = Math.max(0, Math.round((dayAvail - dayCompleted) * 10) / 10);
      totalWastedHours += wasted;
    } else if (day.dateStr > todayISO) {
      // Future day: completely upcoming in the week
      futureTotalAvailable += dayAvail;
      const free = Math.max(0, Math.round((dayAvail - dayScheduled) * 10) / 10);
      futureFreeAvailableHours += free;
    } else {
      // Today (day.dateStr === todayISO)
      // Evaluate based on configured slots and current time
      const firstSlotStartMin = daySlots.length > 0
        ? Math.min(...daySlots.map((s) => timeToMinutes(s.start)))
        : 24 * 60;
      const lastSlotEndMin = daySlots.length > 0
        ? Math.max(...daySlots.map((s) => timeToMinutes(s.end)))
        : 0;

      if (nowMinutes >= lastSlotEndMin) {
        // By the end of the day (all available hours of today have passed):
        // Check how many hours were completed today, and put the rest of the hours into WASTED HOURS!
        pastAvailableHours += dayAvail;
        const wasted = Math.max(0, Math.round((dayAvail - dayCompleted) * 10) / 10);
        totalWastedHours += wasted;
        // 0 free capacity remaining for today
      } else if (nowMinutes <= firstSlotStartMin) {
        // Before today's available hours have started:
        futureTotalAvailable += dayAvail;
        const free = Math.max(0, Math.round((dayAvail - dayScheduled - dayCompleted) * 10) / 10);
        futureFreeAvailableHours += free;
      } else {
        // During today's available window:
        // Calculate how much available time has elapsed so far today
        let elapsedAvailToday = 0;
        for (const slot of daySlots) {
          const sStart = timeToMinutes(slot.start);
          const sEnd = timeToMinutes(slot.end);
          if (nowMinutes >= sEnd) {
            elapsedAvailToday += (sEnd - sStart) / 60;
          } else if (nowMinutes > sStart) {
            elapsedAvailToday += (nowMinutes - sStart) / 60;
          }
        }
        elapsedAvailToday = Math.min(dayAvail, Math.round(elapsedAvailToday * 10) / 10);
        const futureAvailToday = Math.max(0, Math.round((dayAvail - elapsedAvailToday) * 10) / 10);

        pastAvailableHours += elapsedAvailToday;
        futureTotalAvailable += futureAvailToday;

        // Of the elapsed available hours today, uncompleted elapsed hours are wasted so far
        const wastedSoFarToday = Math.max(0, Math.round((elapsedAvailToday - dayCompleted) * 10) / 10);
        totalWastedHours += wastedSoFarToday;

        // Free capacity remaining today = future available minus upcoming scheduled/surplus
        const surplusCompleted = Math.max(0, dayCompleted - elapsedAvailToday);
        const freeToday = Math.max(
          0,
          Math.round((futureAvailToday - dayScheduled - surplusCompleted) * 10) / 10
        );
        futureFreeAvailableHours += freeToday;
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

