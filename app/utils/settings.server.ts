import { z } from 'zod';
import type { CityTimezone } from '~/types/timezone';
import { CITY_TIMEZONES } from '~/types/timezone';

const settingsSchema = z.object({
  excludeInactiveService: z.coerce.boolean().default(false),
  excludeInactiveInterface: z.coerce.boolean().default(false),
  preferredTimezone: z.enum(Object.keys(CITY_TIMEZONES) as [string, ...string[]]).default('Hong Kong'),
});

export type Settings = z.infer<typeof settingsSchema>;

function parseCookies(cookieHeader: string) {
  return Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=');
      return [key, v.join('=')];
    })
  );
}

export function parseSettings(request: Request): Settings {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookies = parseCookies(cookieHeader);

  let storedSettings: Settings | undefined;
  try {
    const omsSettings = cookies['oms-settings'];
    if (omsSettings) {
      storedSettings = JSON.parse(decodeURIComponent(omsSettings));
    }
  } catch (e) {
    console.error('Failed to parse stored settings:', e);
  }

  const settings = {
    excludeInactiveService: url.searchParams.has('excludeInactive') 
      ? true 
      : storedSettings?.excludeInactiveService ?? false,
    excludeInactiveInterface: url.searchParams.has('excludeInactive') 
      ? true 
      : storedSettings?.excludeInactiveInterface ?? false,
    preferredTimezone: storedSettings?.preferredTimezone ?? 'Hong Kong',
  };

  return settingsSchema.parse(settings);
}
