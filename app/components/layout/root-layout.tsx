import { Link, useLocation } from "@remix-run/react";
import { Home, Server, GitBranch, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSettings } from "~/contexts/settings-context";
import { SettingsPanel } from "~/components/settings/settings-panel";

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
              <SettingsPanel />
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