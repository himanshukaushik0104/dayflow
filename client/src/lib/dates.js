// Today as YYYY-MM-DD in the browser's local timezone. Uses local
// (not UTC) so a user in Asia/Kolkata at 00:30 IST sees the new day,
// not yesterday in UTC.
export function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatLongDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Day-of-week as 0=Sun … 6=Sat (matches JS Date.getDay()).
export function dayOfWeekFor(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

// UI ordering for the weekday tabs — Mon-first, Sunday at the end —
// stored as { value: 0..6, short, long }.
export const WEEKDAYS = [
  { value: 1, short: 'Mon', long: 'Monday' },
  { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' },
  { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' },
  { value: 6, short: 'Sat', long: 'Saturday' },
  { value: 0, short: 'Sun', long: 'Sunday' },
];
