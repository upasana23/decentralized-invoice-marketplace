"use client"
import { motion } from "framer-motion"
import { LayoutDashboard, FileText, TrendingUp, Wallet, LogOut, Search, PlusCircle, History, UserCheck, Clock, Receipt, CreditCard } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { useAuth, type UserRole } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

// <CHANGE> Replaced admin navigation with bigbuyer navigation
const ROLE_NAV = {
  msme: [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard/msme" },
    { label: "Create Invoice", icon: PlusCircle, href: "/dashboard/msme/tokenize" },
    { label: "Active Invoices", icon: FileText, href: "/dashboard/msme/active" },
    { label: "Settled History", icon: History, href: "/dashboard/msme/history" },
    { label: "Reputation", icon: UserCheck, href: "/dashboard/msme/reputation" },
    { label: "Wallet", icon: Wallet, href: "/dashboard/msme/wallet" },
  ],
  investor: [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard/investor" },
    { label: "Invoice Marketplace", icon: Search, href: "/dashboard/investor/marketplace" },
    { label: "My Portfolio", icon: TrendingUp, href: "/dashboard/investor/portfolio" },
    { label: "Returns", icon: History, href: "/dashboard/investor/returns" },
    { label: "Wallet", icon: Wallet, href: "/dashboard/investor/wallet" },
  ],
  bigbuyer: [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard/bigbuyer" },
    { label: "Outstanding Invoices", icon: Clock, href: "/dashboard/bigbuyer/outstanding" },
    { label: "Payment History", icon: Receipt, href: "/dashboard/bigbuyer/history" },
    { label: "Reputation", icon: UserCheck, href: "/dashboard/bigbuyer/reputation" },
    { label: "Wallet & Payments", icon: CreditCard, href: "/dashboard/bigbuyer/wallet" },
  ],
}

export function AppSidebar({ role }: { role: UserRole }) {
  const { logout, user } = useAuth()
  const navItems = ROLE_NAV[role] || []

  return (
    <Sidebar variant="inset" collapsible="icon" className="w-64 bg-black/20 backdrop-blur-md border-r border-white/5">
      <SidebarHeader className="h-16 border-b border-white/5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tight">
          <span className="group-data-[collapsible=icon]:hidden font-pirate bg-gradient-to-r from-[#FFD600] via-[#FF8A00] to-[#FF4D00] bg-clip-text text-transparent">CredX</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-orange-300 font-semibold">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={false}>
                    <motion.a 
                      href={item.href}
                      className="relative group bg-transparent hover:bg-transparent data-[active=true]:bg-gradient-to-r data-[active=true]:from-orange-600/10 data-[active=true]:to-transparent"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Active Indicator - Glowing vertical line */}
                      <motion.div 
                        className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_10px_rgba(255,77,0,0.8)] opacity-0 data-[active=true]:opacity-100"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                      <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group-hover:bg-orange-500/5">
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          transition={{ duration: 0.2 }}
                          className="group-hover:drop-shadow-[0_0_8px_rgba(255,165,0,0.6)]"
                        >
                          <item.icon className="size-5 text-orange-400/80 group-hover:text-orange-400" />
                        </motion.div>
                        <span className="font-medium text-orange-300 group-hover:text-orange-400">{item.label}</span>
                      </div>
                    </motion.a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/5 p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="size-8 ring-2 ring-orange-500/20">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "User"}`} />
            <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-orange-200 truncate">{user?.name || "User"}</p>
            <p className="text-xs text-orange-300 capitalize">{role === "bigbuyer" ? "Big Buyer" : role}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            className="group-data-[collapsible=icon]:hidden text-orange-200 hover:text-orange-100 hover:bg-orange-500/20 hover:drop-shadow-[0_0_8px_rgba(255,165,0,0.4)]"
          >
            <LogOut className="size-5 text-orange-400/80" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
