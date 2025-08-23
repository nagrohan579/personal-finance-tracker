'use server'

import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  
  return { supabase, user }
}

async function updateAccountBalance(supabase: any, accountId: string, userId: string, amount: number) {
  // Get current balance
  const { data: account, error: accountError } = await supabase
    .from('financial_accounts')
    .select('balance')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()

  if (accountError) {
    throw new Error(`Failed to get account balance: ${accountError.message}`)
  }

  // Update balance
  const newBalance = account.balance + amount
  const { error: updateError } = await supabase
    .from('financial_accounts')
    .update({ balance: newBalance })
    .eq('id', accountId)
    .eq('user_id', userId)

  if (updateError) {
    throw new Error(`Failed to update account balance: ${updateError.message}`)
  }
}

export async function createTransaction(data: Omit<TransactionInsert, 'user_id'>) {
  const { supabase, user } = await getAuthenticatedUser()
  
  // Handle transfers differently - create two separate transaction entries
  if (data.type === 'TRANSFER' && data.to_account_id) {
    // Create outgoing transaction (negative for source account)
    const { data: outgoingTransaction, error: outgoingError } = await supabase
      .from('transactions')
      .insert({
        amount: data.amount,
        type: 'TRANSFER',
        category: data.category,
        notes: data.notes ? `Transfer to account (${data.notes})` : 'Transfer to account',
        date: data.date,
        account_id: data.account_id,
        to_account_id: data.to_account_id,
        user_id: user.id
      })
      .select()
      .single()

    if (outgoingError) {
      throw new Error(`Failed to create outgoing transfer: ${outgoingError.message}`)
    }

    // Create incoming transaction (positive for destination account)
    const { data: incomingTransaction, error: incomingError } = await supabase
      .from('transactions')
      .insert({
        amount: data.amount,
        type: 'TRANSFER',
        category: data.category,
        notes: data.notes ? `Transfer from account (${data.notes})` : 'Transfer from account',
        date: data.date,
        account_id: data.to_account_id,
        to_account_id: data.account_id, // Reference back to source account
        user_id: user.id
      })
      .select()
      .single()

    if (incomingError) {
      throw new Error(`Failed to create incoming transfer: ${incomingError.message}`)
    }

    // Update both account balances
    await updateAccountBalance(supabase, data.account_id, user.id, -data.amount)
    await updateAccountBalance(supabase, data.to_account_id, user.id, data.amount)

    revalidatePath('/transactions')
    revalidatePath('/dashboard')
    revalidatePath('/accounts')
    return outgoingTransaction
  }

  // For non-transfer transactions, use the original logic
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      ...data,
      user_id: user.id
    })
    .select()
    .single()

  if (transactionError) {
    throw new Error(`Failed to create transaction: ${transactionError.message}`)
  }

  // Update the account balance based on transaction type
  switch (data.type) {
    case 'INCOME':
      // Add income to the account balance
      await updateAccountBalance(supabase, data.account_id, user.id, data.amount)
      break
    case 'EXPENSE':
      // Subtract expense from the account balance
      await updateAccountBalance(supabase, data.account_id, user.id, -data.amount)
      break
    case 'INVESTMENT':
      // Subtract investment from the account balance (money going out)
      await updateAccountBalance(supabase, data.account_id, user.id, -data.amount)
      break
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  return transaction
}

export async function getTransactions(): Promise<(Transaction & { 
  financial_accounts: { name: string; type: string }
  to_financial_accounts?: { name: string; type: string } | null
})[]> {
  const { supabase, user } = await getAuthenticatedUser()
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      financial_accounts!transactions_account_id_fkey (name, type),
      to_financial_accounts:financial_accounts!transactions_to_account_id_fkey (name, type)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return transactions || []
}

export async function getRecentTransactions(limit: number = 5): Promise<(Transaction & { 
  financial_accounts: { name: string; type: string }
  to_financial_accounts?: { name: string; type: string } | null
})[]> {
  const { supabase, user } = await getAuthenticatedUser()
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      financial_accounts!transactions_account_id_fkey (name, type),
      to_financial_accounts:financial_accounts!transactions_to_account_id_fkey (name, type)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch recent transactions: ${error.message}`)
  }

  return transactions || []
}

export async function updateTransaction(id: string, data: Omit<TransactionUpdate, 'user_id' | 'id'>) {
  const { supabase, user } = await getAuthenticatedUser()
  
  // First, get the original transaction to check if amount or account changed
  const { data: originalTransaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch original transaction: ${fetchError.message}`)
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`)
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  return transaction
}

export async function deleteTransaction(id: string) {
  const { supabase, user } = await getAuthenticatedUser()
  
  // First, get the transaction details to reverse the account balance
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch transaction: ${fetchError.message}`)
  }

  // For transfers, we need to handle deletion of both related transactions
  if (transaction.type === 'TRANSFER') {
    // If this is a transfer transaction, find and delete its counterpart
    if (transaction.to_account_id) {
      // Find the corresponding transfer transaction
      const isOutgoing = transaction.notes?.includes('Transfer to account')
      
      if (isOutgoing) {
        // This is the outgoing transaction, find the incoming one
        const { data: incomingTransactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('account_id', transaction.to_account_id)
          .eq('to_account_id', transaction.account_id)
          .eq('amount', transaction.amount)
          .eq('date', transaction.date)
          .eq('type', 'TRANSFER')
          .eq('user_id', user.id)

        if (incomingTransactions && incomingTransactions.length > 0) {
          // Delete the incoming transaction
          await supabase
            .from('transactions')
            .delete()
            .eq('id', incomingTransactions[0].id)
            .eq('user_id', user.id)
        }
      } else {
        // This is the incoming transaction, find the outgoing one
        const { data: outgoingTransactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('account_id', transaction.to_account_id)
          .eq('to_account_id', transaction.account_id)
          .eq('amount', transaction.amount)
          .eq('date', transaction.date)
          .eq('type', 'TRANSFER')
          .eq('user_id', user.id)

        if (outgoingTransactions && outgoingTransactions.length > 0) {
          // Delete the outgoing transaction
          await supabase
            .from('transactions')
            .delete()
            .eq('id', outgoingTransactions[0].id)
            .eq('user_id', user.id)
        }
      }

      // Reverse both account balance changes for transfers
      if (isOutgoing) {
        // Reverse outgoing: add back to source, subtract from destination
        await updateAccountBalance(supabase, transaction.account_id, user.id, transaction.amount)
        await updateAccountBalance(supabase, transaction.to_account_id, user.id, -transaction.amount)
      } else {
        // Reverse incoming: subtract from destination, add back to source
        await updateAccountBalance(supabase, transaction.account_id, user.id, -transaction.amount)
        await updateAccountBalance(supabase, transaction.to_account_id, user.id, transaction.amount)
      }
    }
  } else {
    // For non-transfer transactions, use the original logic
    // Reverse the balance changes based on transaction type
    switch (transaction.type) {
      case 'INCOME':
        // Reverse income (subtract from balance)
        await updateAccountBalance(supabase, transaction.account_id, user.id, -transaction.amount)
        break
      case 'EXPENSE':
        // Reverse expense (add back to balance)
        await updateAccountBalance(supabase, transaction.account_id, user.id, transaction.amount)
        break
      case 'INVESTMENT':
        // Reverse investment (add back to balance)
        await updateAccountBalance(supabase, transaction.account_id, user.id, transaction.amount)
        break
    }
  }

  // Delete the transaction
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to delete transaction: ${error.message}`)
  }

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
}
