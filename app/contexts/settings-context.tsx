import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { CityTimezone } from "~/types/timezone";

interface SettingsContextType {
  excludeInactiveService: boolean;
  excludeInactiveInterface: boolean;
  preferredTimezone: CityTimezone;
  toggleExcludeInactiveService: () => void;
  toggleExcludeInactiveInterface: () => void;
  setPreferredTimezone: (timezone: CityTimezone) => void;
  resetSettings: () => void;
}

interface Settings {
  excludeInactiveService: boolean;
  excludeInactiveInterface: boolean;
  preferredTimezone: CityTimezone;
}

const STORAGE_KEY = "oms-settings";

const DEFAULT_SETTINGS: Settings = {
  excludeInactiveService: false,
  excludeInactiveInterface: false,
  preferredTimezone: "Hong Kong"
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function saveToStorage(settings: Settings) {
  if (typeof window === 'undefined') return;
  
  const settingsString = JSON.stringify(settings);
  try {
    localStorage.setItem(STORAGE_KEY, settingsString);
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(settingsString)}; path=/; max-age=31536000`; // 1 year
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

function getInitialSettings(): Settings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(saved) as Partial<Settings>;
    
    // Validate parsed settings
    if (typeof parsed.excludeInactiveService !== 'boolean' ||
        typeof parsed.excludeInactiveInterface !== 'boolean' ||
        typeof parsed.preferredTimezone !== 'string') {
      return DEFAULT_SETTINGS;
    }

    return parsed as Settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(getInitialSettings());

  useEffect(() => {
    // Remove this since we're already initializing with getInitialSettings
    // setIsClient(true);
    // const savedSettings = getInitialSettings();
    // setSettings(savedSettings);
  }, []);

  const saveSettings = useCallback((newSettings: Settings) => {
    setSettings(newSettings);
    saveToStorage(newSettings);
  }, []);

  const toggleExcludeInactiveService = useCallback(() => {
    saveSettings({
      ...settings,
      excludeInactiveService: !settings.excludeInactiveService
    });
  }, [settings, saveSettings]);

  const toggleExcludeInactiveInterface = useCallback(() => {
    saveSettings({
      ...settings,
      excludeInactiveInterface: !settings.excludeInactiveInterface
    });
  }, [settings, saveSettings]);

  const handleSetTimezone = useCallback((timezone: CityTimezone) => {
    saveSettings({
      ...settings,
      preferredTimezone: timezone
    });
  }, [settings, saveSettings]);

  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const value = {
    ...settings,
    toggleExcludeInactiveService,
    toggleExcludeInactiveInterface,
    setPreferredTimezone: handleSetTimezone,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
