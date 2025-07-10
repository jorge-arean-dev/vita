import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { FontProvider } from "@/components/ui/font-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthStateProvider } from "@/components/auth-state-provider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
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
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FontProvider>
            <AuthStateProvider>
              {children}
              <Toaster />
            </AuthStateProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
