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
import { Badge } from "../ui/badge";
import {
  Clock,
  Plus,
  Trash2,
  RotateCcw,
  Save,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  DAYS_OF_WEEK,
  DEFAULT_WEEKLY_AVAILABILITY,
  saveWeeklyAvailability,
  calculateTotalWeeklyAvailableHours,
  calculateDayAvailableHours,
  calculateSlotHours,
  formatTime12h,
  timeToMinutes,
} from "../../services/availabilityService";
import type { WeeklyAvailability, DayOfWeek, TimeSlot } from "@/types";

interface AvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uid?: string;
  initialAvailability: WeeklyAvailability;
  onSaved: (newAvailability: WeeklyAvailability) => void;
}

export function AvailabilityModal({
  open,
  onOpenChange,
  uid,
  initialAvailability,
  onSaved,
}: AvailabilityModalProps) {
  const [availability, setAvailability] = useState<WeeklyAvailability>(initialAvailability);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync with initial whenever dialog opens
  useEffect(() => {
    if (open) {
      setAvailability(JSON.parse(JSON.stringify(initialAvailability)));
      setValidationError(null);
    }
  }, [open, initialAvailability]);

  // Handle slot field update
  const handleSlotChange = (
    day: DayOfWeek,
    slotId: string,
    field: "start" | "end",
    value: string
  ) => {
    setAvailability((prev) => {
      const daySlots = [...(prev[day] || [])];
      const slotIndex = daySlots.findIndex((s) => s.id === slotId);
      if (slotIndex === -1) return prev;
      daySlots[slotIndex] = {
        ...daySlots[slotIndex],
        [field]: value,
      };
      return {
        ...prev,
        [day]: daySlots,
      };
    });
  };

  // Add slot to a day
  const handleAddSlot = (day: DayOfWeek) => {
    setAvailability((prev) => {
      const daySlots = [...(prev[day] || [])];
      // Default new slot: 09:00 - 12:00 or after last slot
      let defaultStart = "09:00";
      let defaultEnd = "12:00";
      if (daySlots.length > 0) {
        const lastSlot = daySlots[daySlots.length - 1];
        const lastEndMin = timeToMinutes(lastSlot.end);
        if (lastEndMin + 60 <= 23 * 60) {
          const nextStartH = Math.min(22, Math.floor((lastEndMin + 60) / 60));
          defaultStart = `${nextStartH.toString().padStart(2, "0")}:00`;
          defaultEnd = `${Math.min(23, nextStartH + 2).toString().padStart(2, "0")}:00`;
        }
      }

      const newSlot: TimeSlot = {
        id: `${day.toLowerCase().slice(0, 3)}-${Date.now()}`,
        start: defaultStart,
        end: defaultEnd,
      };

      return {
        ...prev,
        [day]: [...daySlots, newSlot],
      };
    });
  };

  // Remove slot from a day
  const handleRemoveSlot = (day: DayOfWeek, slotId: string) => {
    setAvailability((prev) => {
      const daySlots = (prev[day] || []).filter((s) => s.id !== slotId);
      return {
        ...prev,
        [day]: daySlots,
      };
    });
  };

  // Reset to default 32h availability
  const handleResetDefaults = () => {
    setAvailability(JSON.parse(JSON.stringify(DEFAULT_WEEKLY_AVAILABILITY)));
    toast.info("Reset to default 32 hours weekly availability.");
  };

  // Validate entire availability structure
  const validateAvailability = (): string | null => {
    for (const day of DAYS_OF_WEEK) {
      const slots = availability[day] || [];
      for (const slot of slots) {
        if (!slot.start || !slot.end) {
          return `${day}: Time slots must have both start and end times.`;
        }
        if (timeToMinutes(slot.start) >= timeToMinutes(slot.end)) {
          return `${day}: Start time (${formatTime12h(slot.start)}) must be before end time (${formatTime12h(slot.end)}).`;
        }
      }

      // Check overlaps within same day
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i];
          const b = slots[j];
          const aStart = timeToMinutes(a.start);
          const aEnd = timeToMinutes(a.end);
          const bStart = timeToMinutes(b.start);
          const bEnd = timeToMinutes(b.end);

          if (Math.max(aStart, bStart) < Math.min(aEnd, bEnd)) {
            return `${day}: Time slots ${formatTime12h(a.start)}–${formatTime12h(a.end)} and ${formatTime12h(b.start)}–${formatTime12h(b.end)} overlap.`;
          }
        }
      }
    }
    return null;
  };

  // Save to Firestore
  const handleSave = async () => {
    const error = validateAvailability();
    if (error) {
      setValidationError(error);
      toast.error(error);
      return;
    }

    if (!uid) {
      toast.error("You must be logged in to save availability.");
      return;
    }

    setSaving(true);
    setValidationError(null);
    try {
      await saveWeeklyAvailability(uid, availability);
      onSaved(availability);
      toast.success("Weekly availability saved successfully!");
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save availability:", err);
      toast.error("Failed to save weekly availability. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const totalHours = calculateTotalWeeklyAvailableHours(availability);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    My Weekly Availability
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 mt-0.5">
                    Configure your recurring weekly schedule. Tasks can only be scheduled within these hours.
                  </DialogDescription>
                </div>
              </div>

              {/* Total Hours Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge
                  variant="outline"
                  className="px-3 py-1.5 text-sm font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Total: {totalHours} hrs / week
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {validationError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Scrollable Days Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid gap-4">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = availability[day] || [];
              const dayHours = calculateDayAvailableHours(daySlots);

              return (
                <div
                  key={day}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-3 transition-colors hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  {/* Day Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {day}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                      >
                        {dayHours > 0 ? `${dayHours} ${dayHours === 1 ? "hour" : "hours"}` : "No slots"}
                      </Badge>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddSlot(day)}
                      className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Slot
                    </Button>
                  </div>

                  {/* Day Slots List */}
                  {daySlots.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic py-1">
                      No availability scheduled for {day}. Click "Add Slot" to set hours.
                    </p>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-1">
                      {daySlots.map((slot, idx) => {
                        const slotHours = calculateSlotHours(slot.start, slot.end);
                        const isInvalid = timeToMinutes(slot.start) >= timeToMinutes(slot.end);

                        return (
                          <div
                            key={slot.id || idx}
                            className="flex flex-wrap items-center gap-2.5 p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs"
                          >
                            <span className="text-xs text-zinc-400 font-mono w-4 text-center">
                              {idx + 1}.
                            </span>

                            {/* Start Time */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-zinc-500 font-medium">From:</span>
                              <Input
                                type="time"
                                value={slot.start}
                                onChange={(e) =>
                                  handleSlotChange(day, slot.id, "start", e.target.value)
                                }
                                className="h-8 w-28 text-xs font-mono bg-zinc-50 dark:bg-zinc-800"
                              />
                            </div>

                            {/* End Time */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-zinc-500 font-medium">To:</span>
                              <Input
                                type="time"
                                value={slot.end}
                                onChange={(e) =>
                                  handleSlotChange(day, slot.id, "end", e.target.value)
                                }
                                className="h-8 w-28 text-xs font-mono bg-zinc-50 dark:bg-zinc-800"
                              />
                            </div>

                            {/* Slot summary tag */}
                            <div className="flex-1 flex items-center justify-between min-w-[120px]">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  isInvalid
                                    ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                }`}
                              >
                                {isInvalid
                                  ? "Invalid time"
                                  : `${slotHours}h (${formatTime12h(slot.start)} - ${formatTime12h(slot.end)})`}
                              </span>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveSlot(day, slot.id)}
                                className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 ml-2"
                                title="Remove time slot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="w-full sm:w-auto text-xs text-zinc-600 hover:text-zinc-900 border-zinc-300 dark:border-zinc-700"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset to Default (32 hrs)
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Saving..." : "Save Availability"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

