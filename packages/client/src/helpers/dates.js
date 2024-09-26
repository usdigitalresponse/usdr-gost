import { DateTime } from 'luxon';

// Given a date (represented as a date-only ISO string), return the number of days until that date.
// Specifically, the number of whole days between now and the end of the given day in the local time-zone.
// Example: If today is 2021-01-01, then daysUntil('2021-01-02') returns 1.
// Returns zero if the date is in the past.
export function daysUntil(dateString) {
  const daysDiff = DateTime.fromISO(dateString).endOf('day').diffNow('days').days;
  return daysDiff < 0 ? 0 : Math.floor(daysDiff);
}

export const formatDate = (dateString) => DateTime.fromISO(dateString).toLocaleString(DateTime.DATE_MED);

export const formatDateTime = (dateString) => DateTime.fromISO(dateString).toLocaleString(DateTime.DATETIME_MED);
