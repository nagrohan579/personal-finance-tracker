'use server'

import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'

type Account = Database['public']['Tables']['financial_accounts']['Row']
type AccountInsert = Database['public']['Tables']['financial_accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['financial_accounts']['Update']

export async function createAccount(data: Omit<AccountInsert, 'user_id'>) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: account, error } = await supabase
    .from('financial_accounts')
    .insert({
      ...data,
      user_id: user.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create account: ${error.message}`)
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return account
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: accounts, error } = await supabase
    .from('financial_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`)
  }

  return accounts || []
}

export async function updateAccount(id: string, data: Omit<AccountUpdate, 'user_id' | 'id'>) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: account, error } = await supabase
    .from('financial_accounts')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update account: ${error.message}`)
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return account
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { error } = await supabase
    .from('financial_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`)
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}
