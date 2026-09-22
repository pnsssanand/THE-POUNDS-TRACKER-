const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return gbp.format(Number.isFinite(value) ? value : 0);
}

export function formatSignedMoney(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(value))}`;
}

export function formatHours(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** DD/MM/YYYY from an ISO date (YYYY-MM-DD). */
export function formatDateUK(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Local (Europe/London aware via browser locale) ISO date for a Date. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** YYYY-MM month key. */
export function monthKey(iso: string = todayISO()): string {
  return iso.slice(0, 7);
}

export function startOfWeekISO(date: Date = new Date()): string {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday first
  d.setDate(d.getDate() - day);
  return toISODate(d);
}

export function daysRemainingInMonth(date: Date = new Date()): number {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(0, last - date.getDate());
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function friendlyDayLabel(iso: string): string {
  const today = todayISO();
  const yesterday = toISODate(new Date(Date.now() - 86400000));
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return formatDateUK(iso);
}
