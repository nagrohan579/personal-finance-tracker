'use server'

import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { encryptedDb } from '@/lib/database-encrypted'

type Loan = Database['public']['Tables']['loans']['Row']
type LoanInsert = Database['public']['Tables']['loans']['Insert']
type LoanUpdate = Database['public']['Tables']['loans']['Update']

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('User not authenticated')
  }
  
  return { supabase, user }
}

export async function createLoan(data: Omit<LoanInsert, 'user_id'>) {
  const { supabase, user } = await getAuthenticatedUser()
  
  // Encrypt sensitive data
  const encryptedData = await encryptedDb.encryptLoanData({
    ...data,
    user_id: user.id
  }, user.id)

  const { data: loan, error } = await supabase
    .from('loans')
    .insert(encryptedData as any)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create loan: ${error.message}`)
  }

  // Decrypt the returned loan for client
  const decryptedLoan = await encryptedDb.decryptLoan(loan, user.id)

  revalidatePath('/loans')
  revalidatePath('/dashboard')
  return decryptedLoan
}

export async function getLoans(): Promise<Loan[]> {
  const { supabase, user } = await getAuthenticatedUser()
  
  const { data: loans, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch loans: ${error.message}`)
  }

  if (!loans || loans.length === 0) {
    return []
  }

  // Batch decrypt all loans
  const decryptedLoans = await encryptedDb.batchDecryptLoans(loans, user.id)
  return decryptedLoans
}

export async function updateLoan(id: string, data: Omit<LoanUpdate, 'user_id' | 'id'>) {
  const { supabase, user } = await getAuthenticatedUser()
  
  // Encrypt sensitive data
  const encryptedData = await encryptedDb.encryptLoanData(data, user.id)

  const { data: loan, error } = await supabase
    .from('loans')
    .update(encryptedData as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update loan: ${error.message}`)
  }

  // Decrypt the returned loan for client
  const decryptedLoan = await encryptedDb.decryptLoan(loan, user.id)

  revalidatePath('/loans')
  revalidatePath('/dashboard')
  return decryptedLoan
}

export async function deleteLoan(id: string) {
  const { supabase, user } = await getAuthenticatedUser()
  
  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to delete loan: ${error.message}`)
  }

  revalidatePath('/loans')
  revalidatePath('/dashboard')
}
