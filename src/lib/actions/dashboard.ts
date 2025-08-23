'use server'

import { getAccounts } from './accounts'
import { getTransactions } from './transactions'
import { getLoans } from './loans'

export async function getDashboardStats() {
  try {
    const [accounts, transactions, loans] = await Promise.all([
      getAccounts(),
      getTransactions(),
      getLoans()
    ])

    // Calculate total balance across all accounts
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

    // Calculate monthly income and expenses
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const currentMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear
    })

    const monthlyIncome = currentMonthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calculate total loan debt
    const totalDebt = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0)

    // Get spending by category for current month
    const expensesByCategory = currentMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount
        return acc
      }, {} as Record<string, number>)

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      totalDebt,
      netWorth: totalBalance - totalDebt,
      expensesByCategory,
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
      loansCount: loans.length
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    throw new Error('Failed to fetch dashboard statistics')
  }
}

export async function getMonthlyExpenseData(months: number = 6) {
  try {
    const transactions = await getTransactions()
    const currentDate = new Date()
    
    // Get transactions from the last N months
    const monthlyData: Record<string, Record<string, number>> = {}
    
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthlyData[monthKey] = {}
    }
    
    // First pass: collect all unique categories
    const allCategories = new Set<string>()
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(transaction => {
        allCategories.add(transaction.category)
      })
    
    // Initialize all months with all categories set to 0
    Object.keys(monthlyData).forEach(monthKey => {
      allCategories.forEach(category => {
        const categoryKey = category.toLowerCase().replace(/\s+/g, '')
        monthlyData[monthKey][categoryKey] = 0
      })
    })
    
    // Process transactions
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(transaction => {
        const transactionDate = new Date(transaction.date)
        const monthKey = transactionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        
        // Only include transactions from the last N months
        if (monthlyData[monthKey] !== undefined) {
          const categoryKey = transaction.category.toLowerCase().replace(/\s+/g, '')
          monthlyData[monthKey][categoryKey] += transaction.amount
        }
      })
    
    // Convert to array format for charts
    const chartData = Object.entries(monthlyData).map(([month, categories]) => ({
      month: month.split(' ')[0], // Just the month abbreviation
      ...categories
    }))
    
    return chartData
  } catch (error) {
    console.error('Error fetching monthly expense data:', error)
    throw new Error('Failed to fetch monthly expense data')
  }
}
