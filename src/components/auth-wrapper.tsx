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
      
      console.log('🔍 AuthWrapper: Checking auth state', { user: user?.id, error: error?.message, pathname })
      
      setUser(user)
      setLoading(false)

      // Redirect logic - be more cautious about redirects
      if (!user && !isPublicPath) {
        console.log('🔍 AuthWrapper: No user, redirecting to login')
        router.replace('/login')
      } else if (user && (pathname === '/login' || pathname === '/signup')) {
        // Only redirect to dashboard if we're sure the user is valid
        // Add a small delay to prevent race conditions during account deletion
        setTimeout(() => {
          if (pathname === '/login' || pathname === '/signup') {
            console.log('🔍 AuthWrapper: User exists, redirecting to dashboard')
            router.replace('/dashboard')
          }
        }, 100)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 AuthWrapper: Auth state changed', { event, hasSession: !!session, hasUser: !!session?.user })
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('🔍 AuthWrapper: User signed out, clearing state')
          setUser(null)
          if (!isPublicPath) {
            router.replace('/login')
          }
        } else if (event === 'SIGNED_IN' && session.user) {
          console.log('🔍 AuthWrapper: User signed in')
          setUser(session.user)
          // Reload currency preferences when user signs in
          await reloadPreferences()
          if (pathname === '/login' || pathname === '/signup') {
            router.replace('/dashboard')
          }
        } else if (event === 'TOKEN_REFRESHED' && !session?.user) {
          // Handle case where token refresh fails (user might be deleted)
          console.log('🔍 AuthWrapper: Token refresh failed, user might be deleted')
          setUser(null)
          if (!isPublicPath) {
            router.replace('/login')
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, pathname, isPublicPath, supabase.auth, reloadPreferences])

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
