import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useSettings } from "~/contexts/settings-context";
import type { CityTimezone } from "~/types/timezone";
import { CITY_TIMEZONES } from "~/types/timezone";

export function TimezoneSelector() {
  const { preferredTimezone, setPreferredTimezone } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (timezone: CityTimezone) => {
    setPreferredTimezone(timezone);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Preferred Timezone
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
        >
          <span>{preferredTimezone} ({CITY_TIMEZONES[preferredTimezone]})</span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {isOpen && (
          <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto">
            {Object.entries(CITY_TIMEZONES).map(([city, timezone]) => (
              <button
                key={city}
                onClick={() => handleSelect(city as CityTimezone)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-gray-100"
              >
                <span>{city} ({timezone})</span>
                {city === preferredTimezone && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500">
        All times will be displayed in your preferred timezone
      </p>
    </div>
  );
} 