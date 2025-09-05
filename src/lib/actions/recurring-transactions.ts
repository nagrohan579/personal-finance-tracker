'use server'

import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { createTransaction } from '@/lib/actions/transactions'
import { revalidatePath } from 'next/cache'
import { encryptedDb } from '@/lib/database-encrypted'
import { encryption } from '@/lib/encryption'

type RecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row']
type RecurringTransactionInsert = Database['public']['Tables']['recurring_transactions']['Insert']
type RecurringTransactionUpdate = Database['public']['Tables']['recurring_transactions']['Update']

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  
  return { supabase, user }
}

export async function createRecurringTransaction(data: Omit<RecurringTransactionInsert, 'user_id' | 'next_due_date'>) {
  const { supabase, user } = await getAuthenticatedUser()
  
  // Calculate next due date (first occurrence)
  const startDate = new Date(data.start_date)
  const nextDueDate = new Date(startDate)
  
  if (data.frequency === 'MONTHLY') {
    nextDueDate.setMonth(nextDueDate.getMonth() + 1)
  } else if (data.frequency === 'YEARLY') {
    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
  }
  
  // Encrypt sensitive data
  const encryptedData = await encryptedDb.encryptRecurringTransactionData({
    ...data,
    user_id: user.id,
    next_due_date: nextDueDate.toISOString().split('T')[0]
  }, user.id)

  const { data: recurringTransaction, error } = await supabase
    .from('recurring_transactions')
    .insert(encryptedData as any)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create recurring transaction: ${error.message}`)
  }

  // Decrypt the returned transaction for client
  const decryptedTransaction = await encryptedDb.decryptRecurringTransaction(recurringTransaction, user.id)

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  return decryptedTransaction
}

export async function getRecurringTransactions(): Promise<(RecurringTransaction & { financial_accounts: { name: string; type: string } })[]> {
  const { supabase, user } = await getAuthenticatedUser()
  
  const { data: recurringTransactions, error } = await supabase
    .from('recurring_transactions')
    .select(`
      *,
      financial_accounts!recurring_transactions_account_id_fkey (
        name,
        type
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch recurring transactions: ${error.message}`)
  }

  if (!recurringTransactions || recurringTransactions.length === 0) {
    return []
  }

  // Batch decrypt all recurring transactions
  const decryptedTransactions = await encryptedDb.batchDecryptRecurringTransactions(recurringTransactions, user.id)
  
  // Also need to decrypt account names in the joined data
  const processedTransactions = await Promise.all(
    decryptedTransactions.map(async (tx: any) => {
      const result = { ...tx }
      if (tx.financial_accounts && tx.financial_accounts.name) {
        // Decrypt the account name
        result.financial_accounts = {
          ...tx.financial_accounts,
          name: await encryption.decryptString(tx.financial_accounts.name, user.id)
        }
      }
      return result
    })
  )

  return processedTransactions as any
}

export async function updateRecurringTransaction(id: string, data: Omit<RecurringTransactionUpdate, 'user_id'>) {
  const { supabase, user } = await getAuthenticatedUser()
  
  // Encrypt sensitive data
  const encryptedData = await encryptedDb.encryptRecurringTransactionData(data, user.id)

  const { data: recurringTransaction, error } = await supabase
    .from('recurring_transactions')
    .update(encryptedData as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update recurring transaction: ${error.message}`)
  }

  // Decrypt the returned transaction for client
  const decryptedTransaction = await encryptedDb.decryptRecurringTransaction(recurringTransaction, user.id)

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  return decryptedTransaction
}

export async function deleteRecurringTransaction(id: string) {
  const { supabase, user } = await getAuthenticatedUser()
  
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to delete recurring transaction: ${error.message}`)
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}

// Function to process due recurring transactions (to be called by a cron job)
export async function processDueRecurringTransactions() {
  const { supabase } = await getAuthenticatedUser()
  
  // Get all recurring transactions that are due today or overdue
  const today = new Date().toISOString().split('T')[0]
  
  const { data: dueTransactions, error: fetchError } = await supabase
    .from('recurring_transactions')
    .select('*')
    .lte('next_due_date', today)

  if (fetchError) {
    throw new Error(`Failed to fetch due transactions: ${fetchError.message}`)
  }

  for (const recurringTx of dueTransactions || []) {
    try {
      // Note: This function is mainly for manual testing
      // The actual processing should be done via the API endpoint
      // Create the actual transaction using the main createTransaction function
      await createTransaction({
        account_id: recurringTx.account_id,
        to_account_id: recurringTx.to_account_id,
        amount: recurringTx.amount,
        type: recurringTx.type,
        category: recurringTx.category,
        notes: recurringTx.description + ' (Recurring)',
        date: recurringTx.next_due_date
      })

      // Calculate next due date
      const currentDueDate = new Date(recurringTx.next_due_date)
      const nextDueDate = new Date(currentDueDate)
      
      if (recurringTx.frequency === 'MONTHLY') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1)
      } else if (recurringTx.frequency === 'YEARLY') {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1)
      }

      // Update the recurring transaction's next due date
      const { error: updateError } = await supabase
        .from('recurring_transactions')
        .update({
          next_due_date: nextDueDate.toISOString().split('T')[0]
        })
        .eq('id', recurringTx.id)

      if (updateError) {
        console.error(`Failed to update recurring transaction: ${updateError.message}`)
      }
    } catch (error) {
      console.error(`Error processing recurring transaction ${recurringTx.id}:`, error)
    }
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
}
