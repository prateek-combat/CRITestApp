import './globals.css';
import { Providers } from '@/components/Providers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Test Platform',
  description: 'A platform for conducting tests',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="bg-gray-50 font-sans" suppressHydrationWarning>
        <Providers>
          {/* 
              Navigation for admin is handled by test-app/src/app/admin/layout.tsx.
              This layout provides the basic HTML structure and global styles for the entire application.
              Each page can have its own specific layout if needed.
            */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
