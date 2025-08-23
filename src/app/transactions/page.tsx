'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TransactionWithAccount {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
  category: string
  notes: string | null
  date: string
  created_at: string
  financial_accounts?: {
    name: string
    type: string
  }
  to_financial_accounts?: {
    name: string
    type: string
  } | null
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import TransactionForm from '@/components/transaction-form'
import { getTransactions, deleteTransaction } from '@/lib/actions/transactions'
import { Plus, Edit, Trash2, Filter } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'

type Transaction = {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
  category: string
  notes: string | null
  date: string
  created_at: string
  financial_accounts?: {
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
  })
  const { formatCurrency } = useCurrency()

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions()
      setTransactions(data)
      setFilteredTransactions(data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  useEffect(() => {
    let filtered = transactions

    if (filters.search) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.category.toLowerCase().includes(filters.search.toLowerCase()) ||
          transaction.notes?.toLowerCase().includes(filters.search.toLowerCase()) ||
          transaction.financial_accounts?.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((transaction) => transaction.type === filters.type)
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter((transaction) => transaction.category === filters.category)
    }

    setFilteredTransactions(filtered)
  }, [filters, transactions])

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id)
        toast.success('Transaction deleted successfully!')
        fetchTransactions()
      } catch (error) {
        console.error('Failed to delete transaction:', error)
        toast.error('Failed to delete transaction. Please try again.')
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCOME':
        return 'text-green-400'
      case 'EXPENSE':
        return 'text-red-400'
      case 'INVESTMENT':
        return 'text-blue-400'
      case 'TRANSFER':
        return 'text-orange-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getTransactionSign = (transaction: TransactionWithAccount): string => {
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

  const getTransferAmountColor = (transaction: TransactionWithAccount): string => {
    if (transaction.type !== 'TRANSFER') return getTypeColor(transaction.type)
    
    // For transfers, use green for incoming and red for outgoing
    if (transaction.notes?.includes('Transfer from account')) return 'text-green-400'
    if (transaction.notes?.includes('Transfer to account')) return 'text-red-400'
    return 'text-orange-400'
  }

  const uniqueCategories = Array.from(
    new Set(transactions.map((t) => t.category))
  ).sort()

  const uniqueTypes = ['INCOME', 'EXPENSE', 'INVESTMENT', 'TRANSFER']

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-8 border-b border-border">
        <motion.h1 
          variants={itemVariants}
          className="text-2xl sm:text-3xl font-bold"
        >
          Transactions
        </motion.h1>
        <motion.div variants={itemVariants}>
          <TransactionForm 
            onSuccess={fetchTransactions} 
            trigger={
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            }
          />
        </motion.div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Select
                    value={filters.type}
                    onValueChange={(value) =>
                      setFilters({ ...filters, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select
                  value={filters.category}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Transactions ({filteredTransactions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Cards View */}
            <div className="lg:hidden space-y-3 p-4">
              {filteredTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {new Date(transaction.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          // TODO: Implement edit functionality
                          console.log('Edit transaction:', transaction.id)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-base">
                        {transaction.financial_accounts?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.category}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getTransferAmountColor(transaction)}`}>
                        {getTransactionSign(transaction)}
                        {formatCurrency(transaction.amount)}
                      </div>
                      <span className={`${getTypeColor(transaction.type)} text-xs font-medium px-2 py-1 rounded-full`}>
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                  
                  {transaction.notes && (
                    <div className="text-sm text-muted-foreground border-t pt-2">
                      {transaction.notes}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Date</TableHead>
                      <TableHead className="text-left">Account</TableHead>
                      <TableHead className="text-left">Category</TableHead>
                      <TableHead className="text-left">Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-left">Notes</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                {filteredTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b"
                  >
                    <TableCell className="font-medium">
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="truncate">
                        {transaction.financial_accounts?.name || 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate">{transaction.category}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`${getTypeColor(transaction.type)} text-sm font-medium px-2 py-1 rounded-full`}>
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={getTransferAmountColor(transaction)}>
                        {getTransactionSign(transaction)}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.notes ? (
                        <span className="truncate block">
                          {transaction.notes}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            console.log('Edit transaction:', transaction.id)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found.
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </motion.div>
  )
}
