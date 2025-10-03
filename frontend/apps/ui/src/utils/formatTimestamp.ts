import {parseISO} from "date-fns"
import {format, toZonedTime} from "date-fns-tz"

/**
 * Formats a timestamp string according to the specified format and timezone
 * @param timestamp - ISO 8601 timestamp in UTC (e.g., "2025-09-24T05:07:58.260580Z")
 * @param formatString - Backend format string (e.g., "DD.MM.YYYY HH:mm:ss")
 * @param timezone - IANA timezone name (e.g., "America/New_York", "Europe/Berlin"). Defaults to "UTC"
 * @returns Formatted timestamp string in the specified timezone
 */
export const formatTimestamp = (
  timestamp: string,
  formatString: string,
  timezone: string = "UTC"
): string => {
  if (!timestamp) return ""

  try {
    // Parse the UTC timestamp
    const utcDate = parseISO(timestamp)

    // Check if date is valid
    if (isNaN(utcDate.getTime())) {
      return "Invalid date"
    }

    // Convert to target timezone
    const zonedDate = toZonedTime(utcDate, timezone)

    // Convert backend format to date-fns format
    const dateFnsFormat = convertFormatString(formatString)

    // Format the date in the target timezone
    return format(zonedDate, dateFnsFormat, {timeZone: timezone})
  } catch (error) {
    console.error("Error formatting timestamp:", error)
    return "Invalid date"
  }
}

/**
 * Converts backend format string (uppercase) to date-fns format (lowercase)
 * Backend uses: YYYY, MM, DD, HH, mm, ss
 * date-fns uses: yyyy, MM, dd, HH, mm, ss
 */
const convertFormatString = (backendFormat: string): string => {
  return backendFormat
    .replace(/YYYY/g, "yyyy") // Year: YYYY -> yyyy
    .replace(/DD/g, "dd") // Day: DD -> dd
    .replace(/MMMM/g, "MMMM") // Full month name (keep as is)
    .replace(/MMM/g, "MMM") // Short month name (keep as is)
    .replace(/YY/g, "yy") // 2-digit year: YY -> yy
}
