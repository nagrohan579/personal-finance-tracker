'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTransaction } from '@/lib/actions/transactions'
import { createRecurringTransaction } from '@/lib/actions/recurring-transactions'
import { getAccounts } from '@/lib/actions/accounts'
import { handleNumberInput, validateNumberField, validateRequiredField } from '@/lib/utils/form-utils'
import { Plus } from 'lucide-react'

// Helper function for ordinal suffixes
function getOrdinalSuffix(day: number): string {
  const j = day % 10
  const k = day % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

type Account = {
  id: string
  name: string
  type: string
}

type TransactionFormData = {
  account_id: string
  amount: number | string
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT' | 'TRANSFER'
  category: string
  notes: string
  date: string
  isRecurring: boolean
  frequency: 'MONTHLY' | 'YEARLY'
  to_account_id?: string // For transfers
}

const transactionTypes = [
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'TRANSFER', label: 'Transfer' },
]

const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Other',
]

const incomeCategories = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Rental',
  'Gift',
  'Other',
]

const investmentCategories = [
  'SIP',
  'Mutual Funds',
  'Stocks',
  'Bonds',
  'Gold',
  'Real Estate',
  'Fixed Deposit',
  'PPF',
  'ELSS',
  'Cryptocurrency',
  'Other',
]

const transferCategories = [
  'Self Transfer',
  'To Family',
  'To Friend',
  'Bill Payment',
  'Loan Payment',
  'Other',
]

interface TransactionFormProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function TransactionForm({ trigger, onSuccess }: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [formData, setFormData] = useState<TransactionFormData>({
    account_id: '',
    amount: '',
    type: 'EXPENSE',
    category: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    frequency: 'MONTHLY',
    to_account_id: '',
  })

  const handleOpenDialog = async () => {
    try {
      const accountsData = await getAccounts()
      
      // Check if no accounts exist and show toast notification
      if (accountsData.length === 0) {
        toast.error('No bank accounts found. Please create an account first before adding transactions.', {
          duration: 5000,
          action: {
            label: 'Create Account',
            onClick: () => window.location.href = '/accounts'
          }
        })
        return // Don't open the dialog
      }
      
      setAccounts(accountsData)
      setOpen(true)
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      toast.error('Failed to load accounts. Please try again.')
    }
  }

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const accountsData = await getAccounts()
        setAccounts(accountsData)
      } catch (error) {
        console.error('Failed to fetch accounts:', error)
      }
    }

    if (open) {
      fetchAccounts()
    }
  }, [open])

  // Clear to_account_id when category changes away from "Self Transfer"
  useEffect(() => {
    if (formData.type !== 'TRANSFER' || formData.category !== 'Self Transfer') {
      if (formData.to_account_id) {
        setFormData(prev => ({ ...prev, to_account_id: '' }))
      }
    }
  }, [formData.type, formData.category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      const accountValidation = validateRequiredField(formData.account_id, 'Bank account')
      if (!accountValidation.success) {
        toast.error(accountValidation.error)
        setLoading(false)
        return
      }

      const amountValidation = validateNumberField(formData.amount, 'Amount', true)
      if (!amountValidation.success) {
        toast.error(amountValidation.error)
        setLoading(false)
        return
      }

      const categoryValidation = validateRequiredField(formData.category, 'Category')
      if (!categoryValidation.success) {
        toast.error(categoryValidation.error)
        setLoading(false)
        return
      }

      // Validate "To Account" for self transfers only
      if (formData.type === 'TRANSFER' && formData.category === 'Self Transfer') {
        const toAccountValidation = validateRequiredField(formData.to_account_id || '', 'To account')
        if (!toAccountValidation.success) {
          toast.error(toAccountValidation.error)
          setLoading(false)
          return
        }

        if (formData.account_id === formData.to_account_id) {
          toast.error('From account and To account cannot be the same')
          setLoading(false)
          return
        }
      }

      if (formData.isRecurring) {
        // Create recurring transaction
        const recurringData = {
          account_id: formData.account_id,
          description: formData.notes || `${formData.type} - ${formData.category}`,
          amount: amountValidation.value.toString(),
          type: formData.type,
          category: formData.category,
          frequency: formData.frequency,
          start_date: formData.date,
          to_account_id: formData.type === 'TRANSFER' && formData.category === 'Self Transfer' ? formData.to_account_id : undefined,
        }

        await createRecurringTransaction(recurringData)
        toast.success('Recurring transaction created successfully!')
      } else {
        // Create one-time transaction
        const transactionData = {
          account_id: formData.account_id,
          amount: amountValidation.value.toString(),
          type: formData.type,
          category: formData.category,
          notes: formData.notes,
          date: formData.date,
          to_account_id: formData.type === 'TRANSFER' && formData.category === 'Self Transfer' ? formData.to_account_id : undefined,
        }

        await createTransaction(transactionData)
        toast.success('Transaction created successfully!')
      }

      setOpen(false)
      setFormData({
        account_id: '',
        amount: '',
        type: 'EXPENSE',
        category: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        frequency: 'MONTHLY',
        to_account_id: '',
      })
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create transaction:', error)
      toast.error('Failed to create transaction. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCategories = () => {
    switch (formData.type) {
      case 'INCOME':
        return incomeCategories
      case 'EXPENSE':
        return expenseCategories
      case 'INVESTMENT':
        return investmentCategories
      case 'TRANSFER':
        return transferCategories
      default:
        return expenseCategories
    }
  }

  const categories = getCategories()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={handleOpenDialog}>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </div>
      <DialogContent className="sm:max-w-[425px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
            <DialogDescription>
              Add a new transaction to track your finances.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account">
                {formData.type === 'TRANSFER' ? 'From Account' : 'Account'}
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'TRANSFER' && formData.category === 'Self Transfer' && (
              <div className="space-y-2">
                <Label htmlFor="to_account">To Account</Label>
                <Select
                  value={formData.to_account_id || ''}
                  onValueChange={(value) =>
                    setFormData({ ...formData, to_account_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter(account => account.id !== formData.account_id)
                      .map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: handleNumberInput(e.target.value) })
                  }
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value, category: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecurring: checked as boolean })
                  }
                />
                <Label 
                  htmlFor="recurring" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Make this a recurring transaction
                </Label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: 'MONTHLY' | 'YEARLY') =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.frequency === 'MONTHLY' 
                      ? `This transaction will occur every month on the ${new Date(formData.date).getDate()}${getOrdinalSuffix(new Date(formData.date).getDate())}`
                      : `This transaction will occur every year on ${new Date(formData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                    }
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
