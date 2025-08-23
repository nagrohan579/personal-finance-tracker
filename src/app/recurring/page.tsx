'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getRecurringTransactions, deleteRecurringTransaction } from '@/lib/actions/recurring-transactions'
import { Edit, Trash2, Calendar, Clock, RefreshCw } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'

type RecurringTransaction = {
  id: string
  account_id: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
  category: string
  frequency: 'MONTHLY' | 'YEARLY'
  start_date: string
  next_due_date: string
  created_at: string
  financial_accounts: {
    name: string
    type: string
  }
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

export default function RecurringTransactionsPage() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const { formatCurrency } = useCurrency()

  const fetchRecurringTransactions = async () => {
    try {
      const data = await getRecurringTransactions()
      setRecurringTransactions(data)
    } catch (error) {
      console.error('Failed to fetch recurring transactions:', error)
      toast.error('Failed to load recurring transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecurringTransactions()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this recurring transaction? Future transactions will no longer be created automatically.')) {
      try {
        await deleteRecurringTransaction(id)
        toast.success('Recurring transaction deleted successfully!')
        fetchRecurringTransactions()
      } catch (error) {
        console.error('Failed to delete recurring transaction:', error)
        toast.error('Failed to delete recurring transaction. Please try again.')
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'EXPENSE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'INVESTMENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    return frequency === 'MONTHLY' ? Clock : Calendar
  }

  const formatNextDue = (date: string) => {
    const dueDate = new Date(date)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`
    } else if (diffDays === 0) {
      return 'Due today'
    } else if (diffDays === 1) {
      return 'Due tomorrow'
    } else {
      return `Due in ${diffDays} days`
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Recurring Transactions</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-6"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Recurring Transactions</h1>
          <Button onClick={fetchRecurringTransactions} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>

        {recurringTransactions.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No recurring transactions found</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Create a transaction and check "Make this a recurring transaction" to get started.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Your Recurring Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Due</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recurringTransactions.map((transaction) => {
                      const FrequencyIcon = getFrequencyIcon(transaction.frequency)
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{transaction.financial_accounts.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {transaction.financial_accounts.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={transaction.type === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(transaction.type)}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <FrequencyIcon className="w-4 h-4" />
                              <span>{transaction.frequency}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>{new Date(transaction.next_due_date).toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatNextDue(transaction.next_due_date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(transaction.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
