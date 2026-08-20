// Shared by the response DTO and the balance calculation so "how many days does a request
// span" is computed exactly once. Inclusive of both endpoints (a same-day request is 1 day).
export function daysBetweenInclusive(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endUtc - startUtc) / msPerDay) + 1;
}
