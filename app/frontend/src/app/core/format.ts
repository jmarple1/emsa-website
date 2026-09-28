// Dates and times are always shown in Oxford, Ohio time, whatever the
// visitor's own time zone is.
const TZ = 'America/New_York';

const day = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric' });
const time = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

/** e.g. "Sunday, October 5, 1:00 PM – 4:00 PM" */
export function formatWhen(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso);
  let s = `${day.format(start)}, ${time.format(start)}`;
  if (endIso) {
    const end = new Date(endIso);
    s += day.format(end) === day.format(start)
      ? ` – ${time.format(end)}`
      : ` – ${day.format(end)}, ${time.format(end)}`;
  }
  return s;
}
