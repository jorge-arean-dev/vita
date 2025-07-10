'use client';

import { Inter, Space_Mono } from 'next/font/google';
import { useEffect } from 'react';

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
  useEffect(() => {
    // Apply font variables to document root so they're available to portals
    document.documentElement.style.setProperty('--font-inter', inter.style.fontFamily);
    document.documentElement.style.setProperty('--font-space-mono', spaceMono.style.fontFamily);
  }, []);

  return (
    <div className={`${inter.variable} ${spaceMono.variable}`}>
      {children}
    </div>
  );
}
