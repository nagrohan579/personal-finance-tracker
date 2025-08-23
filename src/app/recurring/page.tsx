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
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-8 border-b border-border">
        <motion.h1 
          variants={itemVariants}
          className="text-2xl sm:text-3xl font-bold"
        >
          Recurring Transactions
        </motion.h1>
        <motion.div variants={itemVariants}>
          <Button onClick={fetchRecurringTransactions} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {recurringTransactions.length === 0 ? (
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No recurring transactions found</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Create a transaction and check "Make this a recurring transaction" to get started.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Recurring Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Mobile Cards View */}
                <div className="lg:hidden space-y-3 p-4">
                  {recurringTransactions.map((transaction) => {
                    const FrequencyIcon = getFrequencyIcon(transaction.frequency)
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium truncate flex-1 mr-2">
                            {transaction.description}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                // TODO: Implement edit functionality
                                console.log('Edit recurring transaction:', transaction.id)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDelete(transaction.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium">
                              {transaction.financial_accounts.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.financial_accounts.type}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatCurrency(transaction.amount)}
                            </div>
                            <Badge className={`${getTypeColor(transaction.type)} text-xs`}>
                              {transaction.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-muted-foreground">Category: </span>
                            <span>{transaction.category}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FrequencyIcon className="w-4 h-4" />
                            <span>{transaction.frequency}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground border-t pt-2">
                          {formatNextDue(transaction.next_due_date)}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <div className="overflow-x-auto -mx-6">
                    <div className="min-w-full inline-block align-middle">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-auto">Description</TableHead>
                            <TableHead className="w-auto">Account</TableHead>
                            <TableHead className="w-auto text-right">Amount</TableHead>
                            <TableHead className="w-auto">Type</TableHead>
                            <TableHead className="w-auto">Category</TableHead>
                            <TableHead className="w-auto">Frequency</TableHead>
                            <TableHead className="w-auto">Next Due</TableHead>
                            <TableHead className="w-auto">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                    <TableBody>
                      {recurringTransactions.map((transaction) => {
                        const FrequencyIcon = getFrequencyIcon(transaction.frequency)
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium w-auto">
                              <span className="truncate block">{transaction.description}</span>
                            </TableCell>
                            <TableCell className="w-auto">
                              <div className="flex flex-col">
                                <span className="font-medium truncate">{transaction.financial_accounts.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{transaction.financial_accounts.type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold w-auto">
                              {formatCurrency(transaction.amount)}
                            </TableCell>
                            <TableCell className="w-auto">
                              <Badge className={getTypeColor(transaction.type)}>
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="w-auto">
                              <span className="truncate block">{transaction.category}</span>
                            </TableCell>
                            <TableCell className="w-auto">
                              <div className="flex items-center space-x-2">
                                <FrequencyIcon className="w-4 h-4" />
                                <span>{transaction.frequency}</span>
                              </div>
                            </TableCell>
                            <TableCell className="w-auto">
                              <span className="text-sm">{formatNextDue(transaction.next_due_date)}</span>
                            </TableCell>
                            <TableCell className="w-auto">
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    // TODO: Implement edit functionality
                                    console.log('Edit recurring transaction:', transaction.id)
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleDelete(transaction.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
