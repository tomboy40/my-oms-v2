import { z } from 'zod';

const settingsSchema = z.object({
  excludeInactiveService: z.coerce.boolean().default(false),
  excludeInactiveInterface: z.coerce.boolean().default(false),
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

  // Get settings from localStorage via cookie
  let storedSettings: Settings | undefined;
  try {
    const omsSettings = cookies['oms-settings'];
    if (omsSettings) {
      storedSettings = JSON.parse(decodeURIComponent(omsSettings));
    }
  } catch (e) {
    console.error('Failed to parse stored settings:', e);
  }

  // URL params take precedence over stored settings
  const hasExcludeInactive = url.searchParams.has('excludeInactive');
  
  const settings = {
    excludeInactiveService: hasExcludeInactive 
      ? true 
      : storedSettings?.excludeInactiveService ?? false,
    excludeInactiveInterface: hasExcludeInactive 
      ? true 
      : storedSettings?.excludeInactiveInterface ?? false,
  };

  return settingsSchema.parse(settings);
}
