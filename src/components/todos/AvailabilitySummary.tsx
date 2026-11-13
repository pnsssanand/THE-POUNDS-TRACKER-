import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Clock,
  CalendarCheck,
  CheckCircle2,
  Hourglass,
  CalendarDays,
  Settings2,
  AlertTriangle,
  Flame,
  Radio,
} from "lucide-react";
import {
  calculateAdvancedWeeklyMetrics,
  formatGMTLiveTime,
  getUKWeekDays,
} from "../../services/availabilityService";
import type { TodoTask, WeeklyAvailability } from "@/types";

interface AvailabilitySummaryProps {
  availability: WeeklyAvailability;
  tasks: TodoTask[];
  onOpenAvailability: () => void;
  onOpenPlanner: () => void;
  onScheduleTask: () => void;
}

export function AvailabilitySummary({
  availability,
  tasks,
  onOpenAvailability,
  onOpenPlanner,
  onScheduleTask,
}: AvailabilitySummaryProps) {
  // Live Greenwich Mean Time (GMT) clock in 12-hour format with hh:mm:ss AM/PM
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

  // Current UK week info (derived from live GMT time)
  // Automatically shifts to the next week every Monday at 00:00:00 GMT
  const weekInfo = useMemo(() => {
    return getUKWeekDays();
  }, [currentTime]);

  // Calculate day-aware metrics:
  // - Automatically recalculates every minute and hour as GMT time moves forward
  // - Automatically resets every Monday at 00:00 GMT when week bounds shift
  const metrics = useMemo(() => {
    return calculateAdvancedWeeklyMetrics(availability, tasks, currentTime);
  }, [availability, tasks, currentTime]);

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-indigo-500/5 shadow-xs overflow-hidden">
      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* Header & Subtitle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                Weekly Availability & Task Scheduling Summary
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {weekInfo.days[0].formattedDate} – {weekInfo.days[6].formattedDate}
              </span>

              {/* Greenwich Mean Time (GMT) live 12-hour clock */}
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-xs font-semibold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>GMT: {gmtClock}</span>
              </div>

              {/* Hourly update & Monday reset badge */}
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80">
                Auto-updates every hour · Resets every Monday
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Automated statistics tracking your configured weekly hours, scheduled commitments, remaining free time, and past wasted hours. Resets every Monday at 00:00 GMT.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenAvailability}
              className="h-8 text-xs font-medium border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
            >
              <Settings2 className="w-3.5 h-3.5 mr-1.5" />
              My Availability
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenPlanner}
              className="h-8 text-xs font-medium border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-zinc-600 dark:text-zinc-400" />
              Weekly Planner
            </Button>
          </div>
        </div>

        {/* 5 Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          {/* 1. Weekly Available Hours */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">Available Hours</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {metrics.totalWeeklyHours}
              <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
            </div>
            <p className="text-[11px] text-zinc-400">Weekly repeating target</p>
          </div>

          {/* 2. Scheduled Hours */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">Scheduled Hours</span>
              <CalendarCheck className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {metrics.scheduledHours}
              <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
            </div>
            <p className="text-[11px] text-zinc-400">Planned for this week</p>
          </div>

          {/* 3. Completed Hours */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">Completed Hours</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {metrics.completedHours}
              <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
            </div>
            <p className="text-[11px] text-zinc-400">Achieved this week</p>
          </div>

          {/* 4. Remaining Hours (Free to End of Week, past hours deducted) */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium">Remaining Hours</span>
              <Hourglass className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {metrics.remainingHoursToEndOfWeek}
              <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate" title="Free capacity until Sunday 23:59 GMT (updates every hour)">
              Free remaining capacity (updates hourly)
            </p>
          </div>

          {/* 5. Wasted Hours (in place of Productivity) */}
          <div className="col-span-2 md:col-span-1 p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-red-200/80 dark:border-red-900/60 shadow-2xs space-y-1 bg-gradient-to-br from-red-50/30 to-transparent dark:from-red-950/20">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-medium text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                Wasted Hours
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                {metrics.wastedPercentage}% lost
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {metrics.wastedHours}
                <span className="text-xs font-normal text-zinc-500 ml-1">hrs</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400" title="Unused available hours. Resets every Monday at 00:00 GMT">
              Past unscheduled hours · Resets Monday
            </p>
            <Progress
              value={metrics.wastedPercentage}
              className="h-1.5 mt-1 bg-zinc-100 dark:bg-zinc-800 [&>div]:bg-red-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
