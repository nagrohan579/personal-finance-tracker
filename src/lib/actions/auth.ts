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
  console.log('🚀 Starting deleteUserAccount function')
  
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  console.log('👤 Auth check - user:', user?.id, 'email:', user?.email, 'authError:', authError?.message)
  
  if (authError || !user) {
    console.log('❌ User not authenticated, throwing error')
    throw new Error('User not authenticated')
  }

  try {
    console.log('🗑️ Starting data deletion for user:', user.id)
    
    // Delete financial accounts (this will cascade to transactions if set up properly)
    console.log('💾 Deleting financial accounts...')
    const { error: accountsError } = await supabase
      .from('financial_accounts')
      .delete()
      .eq('user_id', user.id)
    
    console.log('💾 Financial accounts deletion result:', { accountsError: accountsError?.message })
    if (accountsError) {
      console.warn('Error deleting financial accounts:', accountsError.message)
    }

    // Delete loans
    console.log('💳 Deleting loans...')
    const { error: loansError } = await supabase
      .from('loans')
      .delete()
      .eq('user_id', user.id)
    
    console.log('💳 Loans deletion result:', { loansError: loansError?.message })
    if (loansError) {
      console.warn('Error deleting loans:', loansError.message)
    }

    // Delete recurring transactions
    console.log('🔄 Deleting recurring transactions...')
    const { error: recurringError } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('user_id', user.id)
    
    console.log('🔄 Recurring transactions deletion result:', { recurringError: recurringError?.message })
    if (recurringError) {
      console.warn('Error deleting recurring transactions:', recurringError.message)
    }

    // Delete transactions (if not cascade deleted)
    console.log('💰 Deleting transactions...')
    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)
    
    console.log('💰 Transactions deletion result:', { transactionsError: transactionsError?.message })
    if (transactionsError) {
      console.warn('Error deleting transactions:', transactionsError.message)
    }

    // Delete user preferences
    console.log('⚙️ Deleting user preferences...')
    const { error: preferencesError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', user.id)
    
    console.log('⚙️ User preferences deletion result:', { preferencesError: preferencesError?.message })
    if (preferencesError) {
      console.warn('Error deleting user preferences:', preferencesError.message)
    }

    // Delete the user from auth.users using the PostgreSQL function
    // This must be done BEFORE sign out so auth.uid() still works
    console.log('🎯 About to call PostgreSQL function delete_user_account for user:', user.id)
    const { error: authUserDeleteError } = await supabase.rpc('delete_user_account')
    
    console.log('🎯 PostgreSQL function call completed. Result:', { 
      authUserDeleteError: authUserDeleteError?.message || 'No error',
      errorCode: authUserDeleteError?.code,
      errorDetails: authUserDeleteError?.details,
      fullError: authUserDeleteError
    })
    
    if (authUserDeleteError) {
      console.log('❌ RPC call failed, throwing error')
      throw new Error(`Failed to delete user account: ${authUserDeleteError.message}`)
    }

    // Sign out to clear server-side session after user deletion
    console.log('🚪 Signing out to clear server-side session after user deletion')
    const { error: signOutError } = await supabase.auth.signOut()
    
    if (signOutError) {
      console.log('⚠️ Warning: Could not sign out after deletion:', signOutError.message)
      // Continue anyway since user is already deleted
    } else {
      console.log('✅ User signed out successfully after deletion')
    }
    
    console.log('✅ All deletions completed successfully, user deleted from auth.users')

  } catch (error) {
    console.log('❌ Error caught in deleteUserAccount:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack',
      fullError: error
    })
    
    // Throw all errors since we want to know if account deletion failed
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete user account')
  }

  console.log('✅ Account deletion completed successfully')
  // Note: Redirect will be handled by the client
}
