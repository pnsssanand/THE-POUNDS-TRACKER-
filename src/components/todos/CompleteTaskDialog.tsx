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
import { Textarea } from "../ui/textarea";
import { CheckCircle2, Clock, Calendar, FileText, Check, Timer } from "lucide-react";
import type { TodoTask } from "@/types";
import { formatDateUK } from "../../lib/format";
import { formatTime12h } from "../../services/availabilityService";

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TodoTask | null;
  onConfirm: (task: TodoTask, notes: string, actualHours: number) => Promise<void>;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  task,
  onConfirm,
}: CompleteTaskDialogProps) {
  const [hours, setHours] = useState<number>(1);
  const [minutes, setMinutes] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && task) {
      setNotes(task.completionNotes || "");
      if (task.actualHours !== undefined && task.actualHours > 0) {
        const totalMin = Math.round(task.actualHours * 60);
        setHours(Math.floor(totalMin / 60));
        setMinutes(totalMin % 60);
      } else {
        // Default to 1 hour
        setHours(1);
        setMinutes(0);
      }
    }
  }, [open, task]);

  const totalCalculatedHours = useMemo(() => {
    const totalMin = Math.max(0, hours * 60 + minutes);
    return Math.round((totalMin / 60) * 100) / 100;
  }, [hours, minutes]);

  if (!task) return null;

  // Preset buttons
  const applyPreset = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const finalHours = totalCalculatedHours > 0 ? totalCalculatedHours : 0.5;
      await onConfirm(task, notes, finalHours);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to complete task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Mark Task as Completed</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Record how much time it took and what you accomplished.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Task Summary Card */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              {task.title}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-400" />
                {formatDateUK(task.dueDate)}
              </span>
              {task.startTime && task.endTime ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-3 h-3" />
                  {formatTime12h(task.startTime)} – {formatTime12h(task.endTime)}
                </span>
              ) : task.dueTime ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime12h(task.dueTime)}
                </span>
              ) : null}
              <span className="px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                {task.category}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                "{task.description}"
              </p>
            )}
          </div>

          {/* Time Taken Input (How much time did it take?) */}
          <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 uppercase tracking-wide">
                <Timer className="w-4 h-4 text-emerald-600" />
                How much time did it take? *
              </Label>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-200/70 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100">
                {totalCalculatedHours} {totalCalculatedHours === 1 ? "hour" : "hours"}
              </span>
            </div>

            {/* Hours and Minutes Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 font-medium">Hours:</span>
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-9 bg-white dark:bg-zinc-900 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 font-medium">Minutes:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={minutes}
                  onChange={(e) =>
                    setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))
                  }
                  className="h-9 bg-white dark:bg-zinc-900 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Quick duration presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "30m", h: 0, m: 30 },
                  { label: "45m", h: 0, m: 45 },
                  { label: "1h", h: 1, m: 0 },
                  { label: "1h 30m", h: 1, m: 30 },
                  { label: "2h", h: 2, m: 0 },
                  { label: "3h", h: 3, m: 0 },
                  { label: "4h", h: 4, m: 0 },
                ].map((p) => {
                  const isCurrent = hours === p.h && minutes === p.m;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.h, p.m)}
                      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-400"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-0.5">
              💡 This time will be added directly into your <strong>Completed Hours</strong> summary.
            </p>
          </div>

          {/* Notes Question */}
          <div className="space-y-2">
            <Label
              htmlFor="completion-notes"
              className="text-xs font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              What have you done? (Completion Notes)
            </Label>
            <Textarea
              id="completion-notes"
              rows={3}
              placeholder="Describe what you completed, progress made, links, results..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs leading-relaxed resize-none focus-visible:ring-emerald-500"
            />
            <p className="text-[11px] text-zinc-400">
              These notes will be saved and visible when you click on Completed Tasks.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSubmitting || totalCalculatedHours <= 0}
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            {isSubmitting ? "Saving..." : "Save & Complete Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
