// India Standard Time is a fixed UTC+5:30 offset year-round (no DST), so
// calendar-day boundaries can be computed with plain arithmetic instead
// of a timezone library. This is the one place that offset lives —
// notification due-dates must use it instead of raw server/browser time.
const APP_TZ_OFFSET_MINUTES = 330 // Asia/Kolkata

// Midnight (in app timezone) of the calendar day a given instant falls on,
// expressed as a UTC Date so day-to-day comparisons are exact.
function toAppCalendarDate(date) {
  const shifted = new Date(date.getTime() + APP_TZ_OFFSET_MINUTES * 60000)
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()))
}

function appToday() {
  return toAppCalendarDate(new Date())
}

function addDays(date, days) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

module.exports = { toAppCalendarDate, appToday, addDays }
