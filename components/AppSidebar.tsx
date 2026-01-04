"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

type NavItem = {
  name: string
  href: string
  icon: React.ReactNode
}

type RoleNavItems = {
  [key: string]: NavItem[]
}

const navItems: RoleNavItems = {
  msme: [
    { name: "Dashboard", href: "/dashboard/msme", icon: "📊" },
    { name: "Create Invoice", href: "/dashboard/msme/tokenize", icon: "➕" },
    { name: "My Invoices", href: "/dashboard/msme/invoices", icon: "📝" },
  ],
  investor: [
    { name: "Dashboard", href: "/dashboard/investor", icon: "📊" },
    { name: "Marketplace", href: "/dashboard/investor/marketplace", icon: "🛒" },
    { name: "My Investments", href: "/dashboard/investor/portfolio", icon: "💼" },
  ],
  bigbuyer: [
    { name: "Dashboard", href: "/dashboard/bigbuyer", icon: "📊" },
    { name: "Outstanding Invoices", href: "/dashboard/bigbuyer/outstanding", icon: "📋" },
    { name: "Payment History", href: "/dashboard/bigbuyer/history", icon: "📜" },
  ],
}

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const items = navItems[user.role] || []

  return (
    <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40 w-64">
      <div className="flex h-full flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span>InvoChain</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                  pathname === item.href ? "bg-gray-100 dark:bg-gray-800" : ""
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
