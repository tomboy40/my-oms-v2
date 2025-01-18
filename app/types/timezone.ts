export const CITY_TIMEZONES = {
  'London': 'Europe/London',
  'Hong Kong': 'Asia/Hong_Kong',
  'Pune': 'Asia/Kolkata',
  'Toronto': 'America/Toronto'
} as const;

export type CityTimezone = keyof typeof CITY_TIMEZONES; 