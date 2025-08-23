'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize anonymous session on app start
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Sign in anonymously if no session exists
        const { error } = await supabase.auth.signInAnonymously()
        if (error) {
          console.error('Failed to sign in anonymously:', error)
        }
      }
    }

    initAuth()
  }, [])

  return <>{children}</>
}
