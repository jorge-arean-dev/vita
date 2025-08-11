"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavLinksProps {
  publicOnly?: boolean
}

export function NavLinks({ publicOnly = false }: NavLinksProps) {
  const pathname = usePathname()

  const allLinks = [
    { href: "/", label: "Home", public: false },
    { href: "/about", label: "About", public: true },
    { href: "/faq", label: "FAQ", public: true },
    { href: "/pricing", label: "Pricing", public: false },
    { href: "/contact", label: "Contact", public: false },
    { href: "/settings", label: "Settings", public: false, authOnly: true },
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
