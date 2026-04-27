/** Returns today's date as YYYY-MM-DD in the Boston / Eastern time zone. */
export function todayET(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

/**
 * Formats a date string (YYYY-MM-DD) or Date for display using Eastern time.
 * Pass options the same as Intl.DateTimeFormat.
 */
export function formatDateET(
  date: string | Date,
  options: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return d.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    ...options,
  });
}
