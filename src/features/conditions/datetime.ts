/**
 * `<input type="datetime-local">` values are wall-clock times in Asia/Tashkent (UTC+5, no DST);
 * the API takes and returns ISO UTC. These two helpers are the only conversion point.
 */
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** A Date as "YYYY-MM-DDTHH:mm" in Asia/Tashkent, for a datetime-local value. */
export function toTashkentInput(date: Date): string {
  return new Date(date.getTime() + TASHKENT_OFFSET_MS).toISOString().slice(0, 16);
}

/** A datetime-local value read as Asia/Tashkent; null when empty or malformed. */
export function fromTashkentInput(value: string): Date | null {
  const match = LOCAL_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number) as [number, number, number, number, number];
  const utc = Date.UTC(year, month - 1, day, hour, minute) - TASHKENT_OFFSET_MS;
  return Number.isNaN(utc) ? null : new Date(utc);
}
