import { NextResponse } from 'next/server'
import { createClient } from '@/lib/auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    console.log('Testing database queries...')

    // Test 1: Fetch accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', user.id)

    if (accountsError) {
      console.error('Accounts error:', accountsError)
      return NextResponse.json({ error: 'Failed to fetch accounts', details: accountsError }, { status: 500 })
    }

    // Test 2: Fetch transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .limit(5)

    if (transactionsError) {
      console.error('Transactions error:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions', details: transactionsError }, { status: 500 })
    }

    // Test 3: Fetch loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)

    if (loansError) {
      console.error('Loans error:', loansError)
      return NextResponse.json({ error: 'Failed to fetch loans', details: loansError }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        accounts: accounts?.length || 0,
        transactions: transactions?.length || 0,
        loans: loans?.length || 0,
        sampleTransaction: transactions?.[0] || null
      }
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: (error as any)?.message || 'Unknown error'
    }, { status: 500 })
  }
}
