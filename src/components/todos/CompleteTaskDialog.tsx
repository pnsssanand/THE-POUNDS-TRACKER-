import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { CheckCircle2, Clock, Calendar, FileText, Check } from "lucide-react";
import type { TodoTask } from "@/types";
import { formatDateUK } from "../../lib/format";
import { formatTime12h } from "../../services/availabilityService";

interface CompleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TodoTask | null;
  onConfirm: (task: TodoTask, notes: string) => Promise<void>;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  task,
  onConfirm,
}: CompleteTaskDialogProps) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes(task?.completionNotes || "");
    }
  }, [open, task]);

  if (!task) return null;

  const handleSubmit = async (notesToSave: string) => {
    setIsSubmitting(true);
    try {
      await onConfirm(task, notesToSave);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to complete task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Mark Task as Completed</DialogTitle>
              <DialogDescription className="text-xs text-zinc-500">
                Record what you accomplished before saving to completed tasks.
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

          {/* Notes Question */}
          <div className="space-y-2">
            <Label htmlFor="completion-notes" className="text-xs font-semibold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              What have you done? (Completion Notes)
            </Label>
            <Textarea
              id="completion-notes"
              rows={4}
              placeholder="e.g. Created the design layout, updated styles, tested on mobile, and finished all checklist items..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
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
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit("")}
            className="text-xs text-zinc-600 border-zinc-300 dark:border-zinc-700"
          >
            Complete Without Notes
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isSubmitting}
            onClick={() => handleSubmit(notes)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            {isSubmitting ? "Saving..." : "Save & Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

