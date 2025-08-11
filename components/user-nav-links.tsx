"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function UserNavLinks() {
  const pathname = usePathname()

  // Placeholder URLs for the required links
  const links = [
    { href: "/jobs", label: "Jobs" },
    { href: "/candidates", label: "Candidates" },
    { href: "/companies", label: "Companies" },
  ]

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`text-sm font-medium transition-colors hover:text-foreground ${
            pathname === link.href ? "text-foreground font-semibold" : "text-muted-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}
