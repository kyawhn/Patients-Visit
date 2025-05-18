import { 
  format, 
  formatDistance, 
  formatRelative, 
  isSameDay, 
  parseISO, 
  isToday 
} from "date-fns";

/**
 * Format a date or ISO string to a readable date format
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  
  if (isToday(dateObj)) {
    return `Today, ${format(dateObj, "h:mm a")}`;
  }
  
  return format(dateObj, "MMM d, yyyy");
}

/**
 * Format a time from a date or ISO string
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "h:mm a");
}

/**
 * Format a duration in minutes to a readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Format a date to show how long ago it was
 */
export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format a date relative to today
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatRelative(dateObj, new Date());
}

/**
 * Check if two dates are on the same day
 */
export function isSameDayCheck(date1: Date | string, date2: Date | string): boolean {
  const date1Obj = typeof date1 === "string" ? parseISO(date1) : date1;
  const date2Obj = typeof date2 === "string" ? parseISO(date2) : date2;
  return isSameDay(date1Obj, date2Obj);
}
