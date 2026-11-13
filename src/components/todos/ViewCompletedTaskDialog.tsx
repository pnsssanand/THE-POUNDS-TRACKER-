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
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  CheckCircle2,
  Calendar,
  Clock,
  FileText,
  Edit3,
  Save,
  Undo2,
  Check,
  Timer,
} from "lucide-react";
import type { TodoTask } from "@/types";
import { formatDateUK } from "../../lib/format";
import { formatTime12h } from "../../services/availabilityService";
import { TASK_PRIORITIES } from "../../services/taskService";
import { toast } from "sonner";

interface ViewCompletedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TodoTask | null;
  onUpdateNotes: (taskId: string, notes: string, actualHours?: number) => Promise<void>;
  onRestoreTask?: (task: TodoTask) => Promise<void>;
}

export function ViewCompletedTaskDialog({
  open,
  onOpenChange,
  task,
  onUpdateNotes,
  onRestoreTask,
}: ViewCompletedTaskDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [actualHours, setActualHours] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && task) {
      setNotes(task.completionNotes || "");
      setActualHours(task.actualHours !== undefined ? task.actualHours : 1);
      setIsEditing(!task.completionNotes); // auto-enable edit if notes are empty
    }
  }, [open, task]);

  if (!task) return null;

  const priorityConfig =
    TASK_PRIORITIES.find((p) => p.value === task.priority) || TASK_PRIORITIES[1];

  const formattedCompletedAt = task.completedAt
    ? new Date(task.completedAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Completed";

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateNotes(task.id, notes, actualHours);
      setIsEditing(false);
      toast.success("Completed task details updated!");
    } catch (err) {
      console.error("Failed to update notes:", err);
      toast.error("Failed to update details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async () => {
    if (onRestoreTask) {
      await onRestoreTask(task);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Completed Task Details</DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Finished on {formattedCompletedAt}
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 text-xs font-semibold px-2.5 py-1"
            >
              <Check className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title & Badges */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-100 leading-snug">
              {task.title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <Calendar className="w-3.5 h-3.5" />
                Scheduled: {formatDateUK(task.dueDate)}
              </span>

              {task.startTime && task.endTime ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  <Clock className="w-3 h-3" />
                  Slot: {formatTime12h(task.startTime)} – {formatTime12h(task.endTime)}
                </span>
              ) : task.dueTime ? (
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Clock className="w-3 h-3" />
                  {formatTime12h(task.dueTime)}
                </span>
              ) : null}

              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${priorityConfig.color}`}
              >
                {task.priority}
              </span>

              <span className="px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-[11px]">
                {task.category}
              </span>
            </div>

            {task.description && (
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-medium text-zinc-500 block mb-0.5">Original Task Notes:</span>
                <p className="whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
          </div>

          {/* Time Taken Box */}
          <div className="p-3.5 rounded-xl border border-emerald-200/90 dark:border-emerald-800/80 bg-white dark:bg-zinc-900 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 uppercase tracking-wide">
                <Timer className="w-4 h-4 text-emerald-600" />
                Time Taken to Complete
              </Label>
              {!isEditing && (
                <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-0.5">
                  {task.actualHours !== undefined ? task.actualHours : 1}{" "}
                  {(task.actualHours || 1) === 1 ? "hour" : "hours"}
                </Badge>
              )}
            </div>

            {isEditing ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-zinc-500">Hours spent:</span>
                <Input
                  type="number"
                  min="0.25"
                  max="24"
                  step="0.25"
                  value={actualHours}
                  onChange={(e) => setActualHours(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="h-8 w-28 text-xs font-semibold"
                />
                <span className="text-xs text-zinc-400">
                  (Added directly into Completed Hours)
                </span>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                This task contributed{" "}
                <strong className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  {task.actualHours !== undefined ? task.actualHours : 1} hours
                </strong>{" "}
                to your completed hours for this week.
              </p>
            )}
          </div>

          {/* Completion Notes Section */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-emerald-600" />
                What I Have Done (Completion Notes)
              </Label>
              {!isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/60 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Edit Details
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2 pt-1">
                <Textarea
                  rows={4}
                  placeholder="Record what you have accomplished for this task..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs bg-white dark:bg-zinc-900 leading-relaxed resize-none focus-visible:ring-emerald-500"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  {task.completionNotes && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotes(task.completionNotes || "");
                        setActualHours(task.actualHours || 1);
                        setIsEditing(false);
                      }}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleSave}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    <Save className="w-3.5 h-3.5 mr-1" />
                    {isSaving ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </div>
            ) : task.completionNotes ? (
              <div className="p-3 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                <p className="whitespace-pre-wrap text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal">
                  {task.completionNotes}
                </p>
              </div>
            ) : (
              <div className="p-3 text-center rounded-lg bg-white/60 dark:bg-zinc-900/60 border border-dashed border-emerald-300 dark:border-emerald-800 text-xs text-zinc-500">
                <p className="italic">No completion notes recorded yet.</p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-emerald-600 font-semibold p-0 h-auto mt-1"
                >
                  + Add notes on what you did
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-2">
          {onRestoreTask && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRestore}
              className="text-xs text-zinc-600 hover:text-emerald-600 w-full sm:w-auto"
            >
              <Undo2 className="w-3.5 h-3.5 mr-1" />
              Restore to Scheduled
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs px-4 w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
