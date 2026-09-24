const DEFAULT_TIMEZONE = 'America/Bogota'
const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const CALENDAR_DATE_PATTERN = /^(\d{4})[-/](\d{2})[-/](\d{2})$/
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Returns the configured app timezone or the default fallback. */
export function getAppTimezone(): string {
  const raw = process.env.APP_TIMEZONE
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_TIMEZONE
  }

  const timezone = raw.trim()
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return timezone
  } catch {
    return DEFAULT_TIMEZONE
  }
}

/** Parses a calendar-only date string into year, month and day components. */
function parseCalendarDateParts(dateString: string): { year: number; month: number; day: number } | null {
  const trimmed = dateString.trim()
  const match = CALENDAR_DATE_PATTERN.exec(trimmed)
  if (match === null) {
    return null
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  }
}

/** Formats calendar parts into the PDF date label (e.g. 24-Sep-2026). */
function formatCalendarPartsToDocumentDate(parts: { year: number; month: number; day: number }): string {
  const monthLabel = MONTH_LABELS[parts.month - 1]
  const day = String(parts.day).padStart(2, '0')
  return `${day}-${monthLabel}-${parts.year}`
}

/** Returns the current calendar date in the app timezone. */
export function getCurrentDateInAppTimezone(format: 'YYYY-MM-DD' | 'YYYY/MM/DD'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: getAppTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const calendarDate = formatter.format(new Date())

  if (format === 'YYYY/MM/DD') {
    return calendarDate.replace(/-/g, '/')
  }

  return calendarDate
}

/** Returns the current time in the app timezone as HH:mm:ss. */
export function getCurrentTimeInAppTimezone(): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: getAppTimezone(),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const parts = formatter.formatToParts(new Date())
  let hour = '00'
  let minute = '00'
  let second = '00'

  for (const part of parts) {
    if (part.type === 'hour') {
      hour = part.value.padStart(2, '0')
    }
    if (part.type === 'minute') {
      minute = part.value.padStart(2, '0')
    }
    if (part.type === 'second') {
      second = part.value.padStart(2, '0')
    }
  }

  return `${hour}:${minute}:${second}`
}

/** Formats a document date for PDF display preserving calendar-only values. */
export function formatDocumentDate(dateString: string): string {
  const calendarParts = parseCalendarDateParts(dateString)
  if (calendarParts !== null) {
    return formatCalendarPartsToDocumentDate(calendarParts)
  }

  const parsedDate = new Date(dateString)
  if (Number.isNaN(parsedDate.getTime())) {
    return dateString
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: getAppTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  const formattedCalendarDate = formatter.format(parsedDate)
  const timezoneCalendarParts = parseCalendarDateParts(formattedCalendarDate)
  if (timezoneCalendarParts === null) {
    return dateString
  }

  return formatCalendarPartsToDocumentDate(timezoneCalendarParts)
}

/** Returns the day-of-week name for a calendar date string. */
export function getDayOfWeekFromCalendarDate(dateString: string): string {
  const calendarParts = parseCalendarDateParts(dateString)
  if (calendarParts === null) {
    const date = new Date(dateString)
    return DAYS_OF_WEEK[date.getDay()]
  }

  const utcDate = new Date(Date.UTC(calendarParts.year, calendarParts.month - 1, calendarParts.day))
  return DAYS_OF_WEEK[utcDate.getUTCDay()]
}

/** Returns day and month from a calendar date string without timezone conversion. */
export function getDayAndMonthFromCalendarDate(dateString: string): { day: string; month: string } {
  const calendarParts = parseCalendarDateParts(dateString)
  if (calendarParts === null) {
    const date = new Date(dateString)
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: String(date.getMonth() + 1).padStart(2, '0')
    }
  }

  return {
    day: String(calendarParts.day).padStart(2, '0'),
    month: String(calendarParts.month).padStart(2, '0')
  }
}
