// Admin editors get times as Oxford local "YYYY-MM-DDTHH:MM" strings (the
// server converts). Format them for display without any time-zone math.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parts(s: string) {
  const [date, time] = s.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const weekday = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const h12 = ((hh + 11) % 12) + 1;
  return { day: `${weekday}, ${MONTHS[m - 1]} ${d}, ${y}`, time: `${h12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}` };
}

/** e.g. "Sun, Oct 4, 2026, 1:00 PM – 4:00 PM" */
export function formatLocal(start: string, end?: string | null): string {
  if (!start) return '';
  const a = parts(start);
  if (!end) return `${a.day}, ${a.time}`;
  const b = parts(end);
  return a.day === b.day ? `${a.day}, ${a.time} – ${b.time}` : `${a.day}, ${a.time} – ${b.day}, ${b.time}`;
}
