"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface MobileNavProps {
  publicOnly?: boolean
}

export function MobileNav({ publicOnly = false }: MobileNavProps) {
  const pathname = usePathname()

  const allLinks = [
    { href: "/", label: "Home", public: false },
    { href: "/about", label: "About", public: true },
    { href: "/faq", label: "FAQ", public: true },
    { href: "/pricing", label: "Pricing", public: false },
    { href: "/contact", label: "Contact", public: false },
  ]
  
  // Filter links based on publicOnly prop
  const links = publicOnly 
    ? allLinks.filter(link => link.public)
    : allLinks

  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
            pathname === link.href ? "text-foreground font-semibold" : "text-muted-foreground"
          }`}
        >
          <span>{link.label}</span>
        </Link>
      ))}
    </>
  )
}
