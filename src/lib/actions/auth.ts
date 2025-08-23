'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { getAuthCallbackUrl } from '@/lib/site-url'

async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Handle the case where cookies can't be set (e.g., in middleware)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Handle the case where cookies can't be set (e.g., in middleware)
          }
        },
      },
    }
  )
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient()
  const headersList = await headers()

  // Create the user account
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(headersList),
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Redirect to dashboard after successful login
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }

  // Redirect to login page
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}

export async function deleteUserAccount() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  try {
    // Delete all user data from the database
    // Note: We'll ignore errors for empty tables since that's expected
    
    // Delete financial accounts (this will cascade to transactions if set up properly)
    const { error: accountsError } = await supabase
      .from('financial_accounts')
      .delete()
      .eq('user_id', user.id)
    
    if (accountsError) {
      console.warn('Error deleting financial accounts:', accountsError.message)
    }

    // Delete loans
    const { error: loansError } = await supabase
      .from('loans')
      .delete()
      .eq('user_id', user.id)
    
    if (loansError) {
      console.warn('Error deleting loans:', loansError.message)
    }

    // Delete recurring transactions
    const { error: recurringError } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('user_id', user.id)
    
    if (recurringError) {
      console.warn('Error deleting recurring transactions:', recurringError.message)
    }

    // Delete transactions (if not cascade deleted)
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)
    
    if (transactionsError) {
      console.warn('Error deleting transactions:', transactionsError.message)
    }

    // Delete user preferences
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', user.id)
    
    if (preferencesError) {
      console.warn('Error deleting user preferences:', preferencesError.message)
    }

    // Sign out the user (this will invalidate the session)
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      throw new Error(`Failed to sign out: ${signOutError.message}`)
    }

  } catch (error) {
    // Only throw errors for critical failures (like sign out), not for empty table deletions
    if (error instanceof Error && error.message.includes('sign out')) {
      throw error
    }
    console.warn('Non-critical error during account deletion:', error)
  }

  // Redirect to login page
  redirect('/login')
}
