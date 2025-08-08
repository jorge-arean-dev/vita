import type { Metadata } from "next"
import { TypographyProvider } from "@/contexts/typography-context"

export const metadata: Metadata = {
  title: "Vita - Streamline recruiting",
  description: "Your toolkit to manage and automate every step of the recruitment process",
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TypographyProvider>
      <div className="light">
        {children}
      </div>
    </TypographyProvider>
  )
}