import { Button } from "~/components/ui/button";
import * as Switch from "@radix-ui/react-switch";
import * as Dialog from "@radix-ui/react-dialog";
import { Settings, X } from "lucide-react";
import { TimezoneSelector } from "./timezone-selector";
import { useSettings } from "~/contexts/settings-context";

export function SettingsPanel() {
  const { 
    excludeInactiveService,
    excludeInactiveInterface,
    toggleExcludeInactiveService,
    toggleExcludeInactiveInterface,
    resetSettings 
  } = useSettings();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-white rounded-lg shadow-lg z-50">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Dialog.Title className="text-lg font-medium">Settings</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500">
                  Customize your application preferences
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button 
                  className="rounded-full p-1.5 hover:bg-gray-100"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Display Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label htmlFor="exclude-service" className="text-sm font-medium">
                        Exclude Inactive Services
                      </label>
                      <p className="text-xs text-gray-500">
                        Hide services that are no longer active
                      </p>
                    </div>
                    <Switch.Root
                      id="exclude-service"
                      checked={excludeInactiveService}
                      onCheckedChange={toggleExcludeInactiveService}
                      className={`${
                        excludeInactiveService ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <Switch.Thumb
                        className={`${
                          excludeInactiveService ? 'translate-x-5' : 'translate-x-1'
                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch.Root>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label htmlFor="exclude-interface" className="text-sm font-medium">
                        Exclude Inactive Interfaces
                      </label>
                      <p className="text-xs text-gray-500">
                        Hide interfaces that are no longer active
                      </p>
                    </div>
                    <Switch.Root
                      id="exclude-interface"
                      checked={excludeInactiveInterface}
                      onCheckedChange={toggleExcludeInactiveInterface}
                      className={`${
                        excludeInactiveInterface ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <Switch.Thumb
                        className={`${
                          excludeInactiveInterface ? 'translate-x-5' : 'translate-x-1'
                        } inline-block h-3 w-3 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch.Root>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Time Settings</h4>
                <TimezoneSelector />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={resetSettings}
                className="text-sm"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 