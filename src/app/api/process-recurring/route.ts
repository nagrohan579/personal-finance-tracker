import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // Check if the request has the correct authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get all recurring transactions that are due today or overdue
    const today = new Date().toISOString().split('T')[0]
    
    const { data: dueTransactions, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .lte('next_due_date', today)

    if (fetchError) {
      throw new Error(`Failed to fetch due transactions: ${fetchError.message}`)
    }

    const processedCount = dueTransactions?.length || 0
    const results = []

    for (const recurringTx of dueTransactions || []) {
      try {
        // Create the actual transaction
        const { error: createError } = await supabase
          .from('transactions')
          .insert({
            user_id: recurringTx.user_id,
            account_id: recurringTx.account_id,
            to_account_id: recurringTx.to_account_id,
            amount: recurringTx.amount,
            type: recurringTx.type,
            category: recurringTx.category,
            notes: recurringTx.description + ' (Recurring)',
            date: recurringTx.next_due_date
          })

        if (createError) {
          console.error(`Failed to create transaction from recurring: ${createError.message}`)
          results.push({ id: recurringTx.id, status: 'error', error: createError.message })
          continue
        }

        // Update the account balance
        let balanceChange = 0
        switch (recurringTx.type) {
          case 'INCOME':
            balanceChange = recurringTx.amount
            break
          case 'EXPENSE':
            balanceChange = -recurringTx.amount
            break
          case 'INVESTMENT':
            balanceChange = -recurringTx.amount
            break
          case 'TRANSFER':
            balanceChange = 0
            break
        }

        if (balanceChange !== 0) {
          // Get current balance
          const { data: account, error: accountError } = await supabase
            .from('financial_accounts')
            .select('balance')
            .eq('id', recurringTx.account_id)
            .single()

          if (accountError) {
            console.error('Failed to get account balance:', accountError)
          } else {
            // Update balance
            const newBalance = account.balance + balanceChange
            const { error: updateError } = await supabase
              .from('financial_accounts')
              .update({ balance: newBalance })
              .eq('id', recurringTx.account_id)

            if (updateError) {
              console.error('Failed to update account balance:', updateError)
            }
          }
        }

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
          results.push({ id: recurringTx.id, status: 'partial', error: updateError.message })
        } else {
          results.push({ id: recurringTx.id, status: 'success' })
        }
      } catch (error) {
        console.error(`Error processing recurring transaction ${recurringTx.id}:`, error)
        results.push({ 
          id: recurringTx.id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} recurring transactions`,
      results
    })
  } catch (error) {
    console.error('Error processing recurring transactions:', error)
    return NextResponse.json(
      { error: 'Failed to process recurring transactions' },
      { status: 500 }
    )
  }
}
