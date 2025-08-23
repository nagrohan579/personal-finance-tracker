'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { Home, CreditCard, Receipt, PiggyBank, BarChart3, Settings, LogOut, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

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

export default function Navigation() {
  const pathname = usePathname()

  return (
    <motion.nav
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-64 bg-card border-r border-border text-card-foreground p-6"
    >
      <div className="mb-8">
        <h1 className="text-xl font-bold flex items-center">
          <BarChart3 className="w-6 h-6 mr-2 text-primary" />
          Finance Tracker
        </h1>
      </div>

      <ul className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 rounded-lg transition-colors relative',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-lg"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className="w-5 h-5 mr-3 relative z-10" />
                <span className="relative z-10">{item.name}</span>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Logout Button */}
      <div className="mt-auto pt-4 border-t border-border">
        <Button
          onClick={() => signOut()}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </motion.nav>
  )
}
