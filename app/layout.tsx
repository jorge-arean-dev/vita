import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { FontProvider } from "@/components/ui/font-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Vita – AI Recruitment Platform for Human-Driven Hiring",
  description: "Combine the speed of AI with your recruitment skills. Vita accelerates sourcing, analysis, and interviews so you can focus on building lasting talent connections.",
  icons: {
    icon: '/logo/vita-logo-light.svg',
    shortcut: '/logo/vita-logo-light.svg',
    apple: '/logo/vita-logo-light.svg',
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <FontProvider>
            <div className="light">
              {children}
              <Toaster />
            </div>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
