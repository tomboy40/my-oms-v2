import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';
import { RootLayout } from './components/layout/root-layout';
import { ErrorBoundary as CustomErrorBoundary } from './components/error-boundary';
import { SettingsProvider } from './contexts/settings-context';

// Import Tailwind CSS
import './tailwind.css';

export const links: LinksFunction = () => [
  { rel: 'icon', href: '/favicon.ico', type: 'image/png' },
];

export const meta = () => [
  { title: 'OMS - Operations Management System' },
  { name: 'description', content: 'Manage your IT services and interfaces efficiently' },
  { name: 'viewport', content: 'width=device-width,initial-scale=1' },
  { charSet: 'utf-8' },
];

export default function App() {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <SettingsProvider>
          <RootLayout>
            <Outlet />
          </RootLayout>
        </SettingsProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <CustomErrorBoundary />
        <Scripts />
      </body>
    </html>
  );
}
