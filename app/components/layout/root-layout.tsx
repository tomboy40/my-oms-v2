import { Link, useLocation } from "@remix-run/react";
import { Home, Server, GitBranch, Share2, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useSettings } from "~/contexts/settings-context";
import * as Switch from "@radix-ui/react-switch";

interface RootLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { name: "Services", href: "/services", icon: Server },
  { name: "Interfaces", href: "/interfaces", icon: GitBranch },
  { name: "Flow Map", href: "/flowmap", icon: Share2 },
];

export function RootLayout({ children }: RootLayoutProps) {
  const location = useLocation();
  const { excludeInactiveService, excludeInactiveInterface, toggleExcludeInactiveService, toggleExcludeInactiveInterface } = useSettings();

  const isActiveRoute = (href: string): boolean => {
    if (href === "/") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-10 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-xl font-bold text-gray-900">OMS</span>
              </div>
              <div className="ml-6 flex space-x-8">
                {navigation.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      prefetch="intent"
                      className={`inline-flex items-center gap-2 border-b-2 px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? "border-primary-500 text-primary-600"
                          : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
                    aria-label="Settings"
                  >
                    <Settings className="w-5 h-5 text-gray-500" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[220px] bg-white rounded-md shadow-lg border border-gray-200 p-2"
                    sideOffset={5}
                    align="end"
                  >
                    <div className="px-2 py-1.5">
                      <h3 className="text-sm font-medium text-gray-900">Exclude Inactive</h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor="exclude-service" className="text-sm text-gray-700">
                            Service
                          </label>
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
                          <label htmlFor="exclude-interface" className="text-sm text-gray-700">
                            Interface
                          </label>
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
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-8 h-[calc(100vh-2rem)]">
        {children}
      </main>
    </div>
  );
}