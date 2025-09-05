'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react'
import { getDashboardStats, getMonthlyExpenseData } from '@/lib/actions/dashboard'
import { getRecentTransactions } from '@/lib/actions/transactions'
import TransactionForm from '@/components/transaction-form'
import { useCurrency } from '@/contexts/currency-context'
import { ExpenseChart } from '@/components/expense-chart'

type DashboardStats = {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  totalDebt: number
  netWorth: number
  expensesByCategory: Record<string, number>
  accountsCount: number
  transactionsCount: number
  loansCount: number
}

type Transaction = {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
  category: string
  notes: string | null
  date: string
  financial_accounts?: {
    name: string
    type: string
  }
  to_financial_accounts?: {
    name: string
    type: string
  } | null
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

const numberVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
      type: "spring" as const,
      stiffness: 100
    }
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [monthlyExpenseData, setMonthlyExpenseData] = useState<Array<{month: string; [category: string]: string | number}>>([])
  const [loading, setLoading] = useState(true)
  const { formatCurrency } = useCurrency()

  const fetchData = async () => {
    try {
      const [dashboardStats, transactions, monthlyData] = await Promise.all([
        getDashboardStats(),
        getRecentTransactions(5),
        getMonthlyExpenseData(6)
      ])
      setStats(dashboardStats)
      setRecentTransactions(transactions as any)
      setMonthlyExpenseData(monthlyData)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getTransactionSign = (transaction: Transaction): string => {
    if (transaction.type === 'INCOME') return '+'
    if (transaction.type === 'EXPENSE' || transaction.type === 'INVESTMENT') return '-'
    
    // For transfers, determine if it's outgoing or incoming by checking the notes
    if (transaction.type === 'TRANSFER') {
      if (transaction.notes?.includes('Transfer to account')) return '-'
      if (transaction.notes?.includes('Transfer from account')) return '+'
      return '' // fallback
    }
    
    return ''
  }

  const getTransferAmountColor = (transaction: Transaction): string => {
    if (transaction.type === 'INCOME') return 'text-green-400'
    if (transaction.type === 'EXPENSE' || transaction.type === 'INVESTMENT') return 'text-red-400'
    
    // For transfers, use green for incoming and red for outgoing
    if (transaction.type === 'TRANSFER') {
      if (transaction.notes?.includes('Transfer from account')) return 'text-green-400'
      if (transaction.notes?.includes('Transfer to account')) return 'text-red-400'
      return 'text-orange-400'
    }
    
    return 'text-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background"
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-8 border-b border-border">
        <motion.h1 
          variants={itemVariants}
          className="text-2xl sm:text-3xl font-bold"
        >
          Dashboard
        </motion.h1>
        <motion.div variants={itemVariants}>
          <TransactionForm
            trigger={
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            }
            onSuccess={() => {
              // Refresh dashboard data
              fetchData()
            }}
          />
        </motion.div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {/* Stats Cards */}
        <motion.div 
          variants={containerVariants}
          className="grid gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Total Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  variants={numberVariants}
                  className="text-lg sm:text-2xl font-bold text-green-400"
                >
                  {formatCurrency(stats?.totalBalance || 0)}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Monthly Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  variants={numberVariants}
                  className="text-lg sm:text-2xl font-bold text-green-400"
                >
                  {formatCurrency(stats?.monthlyIncome || 0)}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Monthly Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <motion.div 
                  variants={numberVariants}
                  className="text-lg sm:text-2xl font-bold text-red-400"
                >
                  {formatCurrency(stats?.monthlyExpenses || 0)}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Net Worth</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <motion.div 
                variants={numberVariants}
                className={`text-lg sm:text-2xl font-bold ${(stats?.netWorth || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {formatCurrency(stats?.netWorth || 0)}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts and Recent Transactions */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Expenses Chart */}
        <motion.div variants={itemVariants}>
          <ExpenseChart 
            expensesByCategory={stats?.expensesByCategory} 
            monthlyData={monthlyExpenseData}
            formatCurrency={formatCurrency}
          />
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={itemVariants}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{transaction.category}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.financial_accounts?.name || 'Unknown Account'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className={`font-medium ${getTransferAmountColor(transaction)}`}>
                        {getTransactionSign(transaction)}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      </div>
    </motion.div>
  )
}
