'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getAccounts, createAccount, updateAccount, deleteAccount } from '@/lib/actions/accounts'
import { handleNumberInput, validateNumberField, validateRequiredField } from '@/lib/utils/form-utils'
import { Plus, Edit, Trash2, CreditCard, Wallet, PiggyBank, DollarSign } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'

type Account = {
  id: string
  name: string
  type: 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'WALLET'
  balance: number
  created_at: string
}

type AccountFormData = {
  name: string
  type: 'SAVINGS' | 'CREDIT_CARD' | 'CASH' | 'WALLET'
  balance: number | string
}

const accountTypes = [
  { value: 'SAVINGS', label: 'Savings', icon: PiggyBank },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: CreditCard },
  { value: 'CASH', label: 'Cash', icon: DollarSign },
  { value: 'WALLET', label: 'Wallet', icon: Wallet },
]

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

export default function AccountsPage() {
  const { formatCurrency } = useCurrency()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState<AccountFormData>({
    name: '',
    type: 'SAVINGS',
    balance: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchAccounts = async () => {
    try {
      const data = await getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate required fields
      const nameValidation = validateRequiredField(formData.name, 'Account name')
      if (!nameValidation.success) {
        toast.error(nameValidation.error)
        setSubmitting(false)
        return
      }

      const balanceValidation = validateNumberField(formData.balance, 'Initial balance', false)
      if (!balanceValidation.success) {
        toast.error(balanceValidation.error)
        setSubmitting(false)
        return
      }

      // Create account data with validated balance
      const accountData = {
        name: formData.name,
        type: formData.type,
        balance: balanceValidation.value,
      }

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData)
        toast.success('Account updated successfully!')
      } else {
        await createAccount(accountData)
        toast.success('Account created successfully!')
      }
      
      setFormOpen(false)
      setEditingAccount(null)
      setFormData({ name: '', type: 'SAVINGS', balance: '' })
      fetchAccounts()
    } catch (error) {
      console.error('Failed to save account:', error)
      toast.error('Failed to save account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
    })
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this account? This will also delete all associated transactions.')) {
      try {
        await deleteAccount(id)
        // Use optimistic update instead of refetching
        setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== id))
        // Small delay to ensure deletion completes
        setTimeout(() => {
          toast.success('Account deleted successfully!')
        }, 100)
      } catch (error) {
        console.error('Failed to delete account:', error)
        toast.error('Failed to delete account. Please try again.')
      }
    }
  }

  const getAccountIcon = (type: string) => {
    const accountType = accountTypes.find(t => t.value === type)
    return accountType ? accountType.icon : CreditCard
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

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
          Accounts
        </motion.h1>
        <motion.div variants={itemVariants}>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditingAccount(null)
                  setFormData({ name: '', type: 'SAVINGS', balance: 0 })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? 'Edit Account' : 'Add New Account'}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount 
                    ? 'Update your account information.'
                    : 'Create a new financial account to track your money.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter account name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Account Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance">Initial Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: handleNumberInput(e.target.value) })}
                    placeholder="Enter initial balance"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {/* Summary Card */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Accounts</p>
                  <p className="text-xl sm:text-2xl font-bold">{accounts.length}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Account Types</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {new Set(accounts.map(a => a.type)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accounts Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {accounts.map((account) => {
              const Icon = getAccountIcon(account.type)
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{account.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {accountTypes.find(t => t.value === account.type)?.label}
                      </p>
                      <p className="text-lg sm:text-2xl font-bold text-green-400">
                        {formatCurrency(account.balance)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Accounts Table */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Name</TableHead>
                      <TableHead className="text-left">Type</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-left hidden sm:table-cell">Created</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      const Icon = getAccountIcon(account.type)
                      return (
                        <TableRow key={account.id}>
                          <TableCell className="w-auto">
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{account.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="w-auto">
                            <span className="truncate">
                              {accountTypes.find(t => t.value === account.type)?.label}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-green-400 text-right w-auto">
                            {formatCurrency(account.balance)}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell w-auto">
                            {new Date(account.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="w-auto">
                            <div className="flex items-center justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEdit(account)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDelete(account.id)}
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
              {accounts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No accounts found. Create your first account to get started!
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
