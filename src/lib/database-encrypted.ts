import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { encryption } from '@/lib/encryption'

type Account = Database['public']['Tables']['financial_accounts']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type Loan = Database['public']['Tables']['loans']['Row']
type RecurringTransaction = Database['public']['Tables']['recurring_transactions']['Row']

// Fields that need encryption for each table
const ENCRYPTED_FIELDS = {
  financial_accounts: ['name', 'balance'] as const,
  transactions: ['amount', 'category', 'notes'] as const,
  loans: ['name', 'total_amount', 'outstanding_balance', 'emi_amount'] as const,
  recurring_transactions: ['description', 'amount', 'category'] as const,
  user_preferences: ['preferences'] as const,
} as const

export class EncryptedDatabaseService {
  private static instance: EncryptedDatabaseService

  private constructor() {}

  public static getInstance(): EncryptedDatabaseService {
    if (!EncryptedDatabaseService.instance) {
      EncryptedDatabaseService.instance = new EncryptedDatabaseService()
    }
    return EncryptedDatabaseService.instance
  }

  // Helper to encrypt an object's specified fields
  private async encryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: readonly string[],
    userId: string
  ): Promise<T> {
    const encrypted = { ...obj } as any
    
    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        if (typeof obj[field] === 'number') {
          encrypted[field] = await encryption.encryptNumber(obj[field], userId)
        } else {
          encrypted[field] = await encryption.encryptString(String(obj[field]), userId)
        }
      }
    }
    
    return encrypted
  }

  // Helper to decrypt an object's specified fields
  private async decryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: readonly string[],
    userId: string,
    numericFields: readonly string[] = []
  ): Promise<T> {
    const decrypted = { ...obj } as any
    
    for (const field of fieldsToDecrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        if (numericFields.includes(field)) {
          decrypted[field] = await encryption.decryptNumber(obj[field] as string, userId)
        } else {
          decrypted[field] = await encryption.decryptString(obj[field] as string, userId)
        }
      }
    }
    
    return decrypted
  }

  // Batch decrypt accounts
  async batchDecryptAccounts(accounts: Account[], userId: string): Promise<Account[]> {
    const decrypted: Account[] = []
    const numericFields = ['balance']
    
    for (const account of accounts) {
      const decryptedAccount = await this.decryptObject(
        account,
        ENCRYPTED_FIELDS.financial_accounts,
        userId,
        numericFields
      )
      decrypted.push(decryptedAccount)
    }
    
    return decrypted
  }

  // Batch decrypt transactions
  async batchDecryptTransactions(transactions: Transaction[], userId: string): Promise<Transaction[]> {
    const decrypted: Transaction[] = []
    const numericFields = ['amount']
    
    for (const transaction of transactions) {
      const decryptedTransaction = await this.decryptObject(
        transaction,
        ENCRYPTED_FIELDS.transactions,
        userId,
        numericFields
      )
      decrypted.push(decryptedTransaction)
    }
    
    return decrypted
  }

  // Batch decrypt loans
  async batchDecryptLoans(loans: Loan[], userId: string): Promise<Loan[]> {
    const decrypted: Loan[] = []
    const numericFields = ['total_amount', 'outstanding_balance', 'emi_amount']
    
    for (const loan of loans) {
      const decryptedLoan = await this.decryptObject(
        loan,
        ENCRYPTED_FIELDS.loans,
        userId,
        numericFields
      )
      decrypted.push(decryptedLoan)
    }
    
    return decrypted
  }

  // Batch decrypt recurring transactions
  async batchDecryptRecurringTransactions(recurringTransactions: RecurringTransaction[], userId: string): Promise<RecurringTransaction[]> {
    const decrypted: RecurringTransaction[] = []
    const numericFields = ['amount']
    
    for (const transaction of recurringTransactions) {
      const decryptedTransaction = await this.decryptObject(
        transaction,
        ENCRYPTED_FIELDS.recurring_transactions,
        userId,
        numericFields
      )
      decrypted.push(decryptedTransaction)
    }
    
    return decrypted
  }

  // Encrypt data for insertion/updates
  async encryptAccountData(data: Partial<Account>, userId: string): Promise<Partial<Account>> {
    return this.encryptObject(data, ENCRYPTED_FIELDS.financial_accounts, userId)
  }

  async encryptTransactionData(data: Partial<Transaction>, userId: string): Promise<Partial<Transaction>> {
    return this.encryptObject(data, ENCRYPTED_FIELDS.transactions, userId)
  }

  async encryptLoanData(data: Partial<Loan>, userId: string): Promise<Partial<Loan>> {
    return this.encryptObject(data, ENCRYPTED_FIELDS.loans, userId)
  }

  async encryptRecurringTransactionData(data: Partial<RecurringTransaction>, userId: string): Promise<Partial<RecurringTransaction>> {
    return this.encryptObject(data, ENCRYPTED_FIELDS.recurring_transactions, userId)
  }

  // Single record decrypt helpers
  async decryptAccount(account: Account, userId: string): Promise<Account> {
    const numericFields = ['balance']
    return this.decryptObject(account, ENCRYPTED_FIELDS.financial_accounts, userId, numericFields)
  }

  async decryptTransaction(transaction: Transaction, userId: string): Promise<Transaction> {
    const numericFields = ['amount']
    return this.decryptObject(transaction, ENCRYPTED_FIELDS.transactions, userId, numericFields)
  }

  async decryptLoan(loan: Loan, userId: string): Promise<Loan> {
    const numericFields = ['total_amount', 'outstanding_balance', 'emi_amount']
    return this.decryptObject(loan, ENCRYPTED_FIELDS.loans, userId, numericFields)
  }

  async decryptRecurringTransaction(recurringTransaction: RecurringTransaction, userId: string): Promise<RecurringTransaction> {
    const numericFields = ['amount']
    return this.decryptObject(recurringTransaction, ENCRYPTED_FIELDS.recurring_transactions, userId, numericFields)
  }

  // Helper to get decrypted balance for calculations
  async getDecryptedBalance(accountId: string, userId: string): Promise<number> {
    const supabase = await createClient()
    const { data: account, error } = await supabase
      .from('financial_accounts')
      .select('balance')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single()

    if (error || !account) {
      throw new Error('Account not found')
    }

    return await encryption.decryptNumber(account.balance as unknown as string, userId)
  }

  // Helper to update encrypted balance
  async updateEncryptedBalance(accountId: string, userId: string, newBalance: number): Promise<void> {
    const supabase = await createClient()
    const encryptedBalance = await encryption.encryptNumber(newBalance, userId)
    
    const { error } = await supabase
      .from('financial_accounts')
      .update({ balance: encryptedBalance as any })
      .eq('id', accountId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update account balance: ${error.message}`)
    }
  }
}

export const encryptedDb = EncryptedDatabaseService.getInstance()