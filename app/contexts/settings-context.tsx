import { createContext, useContext, useEffect, useState } from "react";

interface SettingsContextType {
  excludeInactiveService: boolean;
  excludeInactiveInterface: boolean;
  toggleExcludeInactiveService: () => void;
  toggleExcludeInactiveInterface: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = "oms-settings";

interface Settings {
  excludeInactiveService: boolean;
  excludeInactiveInterface: boolean;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default values
  const [settings, setSettings] = useState<Settings>({
    excludeInactiveService: true,
    excludeInactiveInterface: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem(STORAGE_KEY);
    if (storedSettings) {
      const parsedSettings = JSON.parse(storedSettings);
      setSettings(parsedSettings);
      // Set cookie for server-side access
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(storedSettings)}; path=/`;
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Update cookie whenever settings change
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(settings))}; path=/`;
  }, [settings]);

  const toggleExcludeInactiveService = () => {
    setSettings(prev => ({
      ...prev,
      excludeInactiveService: !prev.excludeInactiveService,
    }));
  };

  const toggleExcludeInactiveInterface = () => {
    setSettings(prev => ({
      ...prev,
      excludeInactiveInterface: !prev.excludeInactiveInterface,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        toggleExcludeInactiveService,
        toggleExcludeInactiveInterface,
      }}
    >
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
