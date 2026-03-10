// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '../components/Navbar';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'CabBook - Ride with Comfort',
  description: 'Book your next ride quickly and safely.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
          <Navbar />
          <main className="flex-grow flex flex-col">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}