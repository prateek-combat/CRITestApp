import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body
        className={`${inter.className} bg-gray-50`}
        suppressHydrationWarning
      >
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
