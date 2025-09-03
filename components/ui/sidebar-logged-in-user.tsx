"use client"

import { useState, useEffect } from "react"
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
  const [isOverlayMode, setIsOverlayMode] = useState(false)
  const pathname = usePathname()

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Handle overlay mode based on window width
  useEffect(() => {
    const handleResize = () => {
      const isNowOverlay = window.innerWidth < 1300
      setIsOverlayMode(isNowOverlay)
      
      // Force collapsed state when entering overlay mode (crossing from desktop to mobile)
      if (isNowOverlay) {
        setCollapsed(true)
      }
    }

    handleResize() // Set initial state
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background border-r transition-all duration-300 ease-in-out",
        // Overlay mode (< 1300px)
        isOverlayMode && [
          // Collapsed: normal positioning, pushes content
          collapsed && "w-16",
          // Expanded: fixed positioning, overlays content with smooth expand from collapsed position
          !collapsed && "fixed left-0 top-0 z-[60] w-56"
        ],
        // Push mode (>= 1300px): normal positioning for both states
        !isOverlayMode && [
          collapsed && "w-16",
          !collapsed && "w-56"
        ]
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
        <TooltipProvider key={collapsed ? 'collapsed' : 'expanded'}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/protected"
                onClick={() => isOverlayMode && setCollapsed(true)}
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
                onClick={() => isOverlayMode && setCollapsed(true)}
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
                onClick={() => isOverlayMode && setCollapsed(true)}
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
                onClick={() => isOverlayMode && setCollapsed(true)}
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
                onClick={() => isOverlayMode && setCollapsed(true)}
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
