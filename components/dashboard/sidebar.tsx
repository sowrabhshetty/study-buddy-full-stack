"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  MessageCircle,
  PieChart,
  Settings,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
}

const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Planner", href: "/planner", icon: Calendar },
  { title: "Analytics", href: "/analytics", icon: PieChart },
]

const aiNav: NavItem[] = [
  { title: "AI Tutor", href: "/ai/tutor", icon: Brain, badge: "AI" },
  { title: "Study Chat", href: "/ai/chat", icon: MessageCircle, badge: "AI" },
  { title: "Quizzes", href: "/quizzes", icon: ClipboardList },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      router.push("/")
    }
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary">
          <BookOpen className="h-6 w-6 shrink-0" />
          {!collapsed && <span className="text-lg font-bold">StudyBuddy</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {/* Main Navigation */}
          <nav className="space-y-1">
            {!collapsed && (
              <span className="mb-2 block px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Main
              </span>
            )}
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </nav>

          {/* AI Hub */}
          <nav className="space-y-1">
            {!collapsed && (
              <span className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                AI Hub
              </span>
            )}
            {aiNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}
          </nav>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-3">
        <nav className="space-y-1">
          <NavLink
            item={{ title: "Settings", href: "/settings", icon: Settings }}
            pathname={pathname}
            collapsed={collapsed}
          />
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </nav>
      </div>
    </aside>
  )
}

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        collapsed && "justify-center px-2",
      )}
      title={collapsed ? item.title : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">{item.badge}</span>
          )}
        </>
      )}
    </Link>
  )
}
