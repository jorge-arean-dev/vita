'use client';

import { Inter, Space_Mono } from 'next/font/google';

// Initialize the Inter font
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Initialize the Space Mono font
export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

interface FontProviderProps {
  children: React.ReactNode;
}

export function FontProvider({ children }: FontProviderProps) {
  return (
    <div className={`${inter.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
