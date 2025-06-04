import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'IQ Test Platform',
  description: 'A platform for conducting IQ tests',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gray-50`}
        suppressHydrationWarning
      >
        <Providers session={null}>
          {/* 
              No global navbar here anymore. 
              Navigation for admin is handled by iq-test-app/src/app/admin/layout.tsx.
              If you need a navbar for public (non-admin) pages, it would be added here
              or in a layout specific to those public pages.
            */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
