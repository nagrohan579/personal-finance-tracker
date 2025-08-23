'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { User } from '@supabase/supabase-js'
import Navigation, { MobileHeader, DesktopSidebar } from '@/components/responsive-navigation'
import { useCurrency } from '@/contexts/currency-context'

interface AuthWrapperProps {
  children: React.ReactNode
}

const publicPaths = ['/login', '/signup', '/auth/callback', '/auth/auth-code-error']

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { reloadPreferences } = useCurrency()

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!
  )

  const isPublicPath = publicPaths.includes(pathname)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      setUser(user)
      setLoading(false)

      // Redirect logic
      if (!user && !isPublicPath) {
        router.replace('/login')
      } else if (user && (pathname === '/login' || pathname === '/signup')) {
        router.replace('/dashboard')
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          if (!isPublicPath) {
            router.replace('/login')
          }
        } else if (event === 'SIGNED_IN' && session.user) {
          setUser(session.user)
          // Reload currency preferences when user signs in
          await reloadPreferences()
          if (pathname === '/login' || pathname === '/signup') {
            router.replace('/dashboard')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, pathname, isPublicPath, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // For public paths, just render children without navigation
  if (isPublicPath) {
    return <>{children}</>
  }

  // For protected paths, require authentication
  if (!user) {
    return null // Will redirect to login
  }

  // For authenticated users on protected paths, show responsive navigation
  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
