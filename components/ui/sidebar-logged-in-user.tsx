"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Briefcase, Building2, ChevronLeft, ChevronRight, House, Users, Settings } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/protected"
                className={cn(
                  "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  collapsed ? "justify-center" : "justify-start",
                  pathname === "/protected" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <House className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
                {!collapsed && <span>Home</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Home</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/protected/jobs"
                className={cn(
                  "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  collapsed ? "justify-center" : "justify-start",
                  pathname === "/protected/jobs" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Briefcase className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
                {!collapsed && <span>Jobs</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Jobs</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/protected/candidates"
                className={cn(
                  "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  collapsed ? "justify-center" : "justify-start",
                  pathname === "/protected/candidates" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Users className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
                {!collapsed && <span>Candidates</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Candidates</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/protected/companies"
                className={cn(
                  "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  collapsed ? "justify-center" : "justify-start",
                  pathname === "/protected/companies" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Building2 className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
                {!collapsed && <span>Companies</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Companies</p>
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/protected/settings"
                className={cn(
                  "flex items-center px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  collapsed ? "justify-center" : "justify-start",
                  pathname === "/protected/settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                <Settings className={cn("h-5 w-5", collapsed ? "mx-0" : "mr-3")} />
                {!collapsed && <span>Settings</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </nav>
    </div>
  )
}
