import { formatInTimeZone, toDate } from 'date-fns-tz';
import type { CityTimezone } from '~/types/timezone';
import { CITY_TIMEZONES } from '~/types/timezone';

// Constants
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS";

// Convert local time to GMT for storage
export function toGMTTime(time: string | null, fromTimezone: string): string {
  if (!time || !time.trim()) return '';
  
  try {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('Invalid time format:', time);
      return '';
    }
    
    // Create a date object for today
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Create a date string in the source timezone
    const dateTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${time}:00`;
    
    // Convert the time string to a Date object in the source timezone
    const sourceDate = toDate(dateTimeStr, { timeZone: fromTimezone });
    
    // Format in UTC/GMT
    return formatInTimeZone(sourceDate, 'UTC', TIME_FORMAT);
  } catch (error) {
    console.error('Error converting time to GMT:', error);
    return '';
  }
}

// Convert GMT time to display timezone
export function fromGMTTime(time: string | null, toTimezone: string): string {
  if (!time || !time.trim()) return '';
  
  try {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('Invalid time format:', time);
      return '';
    }
    
    // Create a date object for today
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    
    // Create a date string in GMT
    const dateTimeStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${time}:00Z`;
    
    // Parse the GMT time string to a Date object
    const gmtDate = new Date(dateTimeStr);
    
    // Format in target timezone
    return formatInTimeZone(gmtDate, toTimezone, TIME_FORMAT);
  } catch (error) {
    console.error('Error converting time from GMT:', error);
    return '';
  }
}

// Format datetime for display in user's timezone
export function formatDateTime(
  dateStr: string | null, 
  timezone: CityTimezone
): string {
  if (!dateStr || !dateStr.trim()) return '';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateStr);
      return '';
    }
    
    const tzName = CITY_TIMEZONES[timezone];
    return formatInTimeZone(date, tzName, 'PPpp');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

// Store datetime in UTC without timezone suffix
export function toUTCString(date: Date): string {
  return date.toISOString().replace('Z', '');
}

// Create current timestamp in UTC
export function nowUTC(): string {
  return toUTCString(new Date());
} 