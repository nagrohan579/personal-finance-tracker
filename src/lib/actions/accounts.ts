'use server'

import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { encryptedDb } from '@/lib/database-encrypted'

type Account = Database['public']['Tables']['financial_accounts']['Row']
type AccountInsert = Database['public']['Tables']['financial_accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['financial_accounts']['Update']

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  
  return { supabase, user }
}

export async function createAccount(data: Omit<AccountInsert, 'user_id'>) {
  const { supabase, user } = await getAuthenticatedUser()

  // Encrypt sensitive data
  const encryptedData = await encryptedDb.encryptAccountData(data, user.id)

  const { data: account, error } = await supabase
    .from('financial_accounts')
    .insert({
      ...encryptedData,
      user_id: user.id
    } as any)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create account: ${error.message}`)
  }

  // Decrypt the returned account for client
  const decryptedAccount = await encryptedDb.decryptAccount(account, user.id)

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return decryptedAccount
}

export async function getAccounts(): Promise<Account[]> {
  const { supabase, user } = await getAuthenticatedUser()

  const { data: accounts, error } = await supabase
    .from('financial_accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch accounts: ${error.message}`)
  }

  if (!accounts || accounts.length === 0) {
    return []
  }

  // Batch decrypt all accounts
  const decryptedAccounts = await encryptedDb.batchDecryptAccounts(accounts, user.id)
  return decryptedAccounts
}

export async function updateAccount(id: string, data: Omit<AccountUpdate, 'user_id' | 'id'>) {
  const { supabase, user } = await getAuthenticatedUser()

  // Encrypt sensitive data
  const encryptedData = await encryptedDb.encryptAccountData(data, user.id)

  const { data: account, error } = await supabase
    .from('financial_accounts')
    .update(encryptedData as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update account: ${error.message}`)
  }

  // Decrypt the returned account for client
  const decryptedAccount = await encryptedDb.decryptAccount(account, user.id)

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return decryptedAccount
}

export async function deleteAccount(id: string) {
  const { supabase, user } = await getAuthenticatedUser()

  const { error } = await supabase
    .from('financial_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`)
  }
}
