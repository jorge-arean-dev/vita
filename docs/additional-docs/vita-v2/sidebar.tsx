"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Briefcase, Building2, ChevronLeft, ChevronRight, Users, Settings } from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const menuItems = [
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background border-r transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="p-4 flex justify-end">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                collapsed ? "justify-center" : "justify-start",
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
