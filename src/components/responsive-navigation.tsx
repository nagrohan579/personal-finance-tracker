'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { useState } from 'react'
import { 
  Home, 
  CreditCard, 
  Receipt, 
  PiggyBank, 
  BarChart3, 
  Settings, 
  LogOut, 
  Calendar,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Accounts',
    href: '/accounts',
    icon: CreditCard,
  },
  {
    name: 'Transactions',
    href: '/transactions',
    icon: Receipt,
  },
  {
    name: 'Recurring',
    href: '/recurring',
    icon: Calendar,
  },
  {
    name: 'Loans',
    href: '/loans',
    icon: PiggyBank,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface NavigationContentProps {
  onItemClick?: () => void
  className?: string
}

// Shared navigation content for both desktop and mobile
function NavigationContent({ onItemClick, className }: NavigationContentProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="mb-8 px-6 pt-6">
        <h1 className="text-xl font-bold flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-primary" />
          Finance Tracker
        </h1>
      </div>

      <nav className="flex-1 px-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center px-4 py-3 rounded-lg transition-colors relative group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary rounded-lg shadow-md"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5 mr-3 relative z-10 transition-transform group-hover:scale-110" />
                  <span className="relative z-10 font-medium">{item.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-6 pb-6 border-t border-border pt-4">
        <Button
          onClick={() => {
            signOut()
            onItemClick?.()
          }}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

// Mobile Header Component
export function MobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-semibold flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-primary" />
          Finance Tracker
        </h1>
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <NavigationContent onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

// Desktop Sidebar Component
export function DesktopSidebar() {
  return (
    <motion.nav
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:flex w-64 bg-card border-r border-border text-card-foreground flex-col"
    >
      <NavigationContent />
    </motion.nav>
  )
}

// Main Navigation Component
export default function Navigation() {
  return (
    <>
      <MobileHeader />
      <DesktopSidebar />
    </>
  )
}
