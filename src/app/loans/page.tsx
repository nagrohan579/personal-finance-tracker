'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { getLoans, createLoan, updateLoan, deleteLoan } from '@/lib/actions/loans'
import { handleNumberInput, validateNumberField, validateRequiredField } from '@/lib/utils/form-utils'
import { Plus, Edit, Trash2, PiggyBank } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'

type Loan = {
  id: string
  name: string
  total_amount: number
  outstanding_balance: number
  emi_amount: number
  start_date: string
  duration_months: number
  created_at: string
}

type LoanFormData = {
  name: string
  total_amount: number | string
  outstanding_balance: number | string
  emi_amount: number | string
  start_date: string
  duration_months: number | string
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

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [formData, setFormData] = useState<LoanFormData>({
    name: '',
    total_amount: '',
    outstanding_balance: '',
    emi_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    duration_months: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const { formatCurrency } = useCurrency()

  const fetchLoans = async () => {
    try {
      const data = await getLoans()
      setLoans(data)
    } catch (error) {
      console.error('Failed to fetch loans:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate required fields
      const nameValidation = validateRequiredField(formData.name, 'Loan name')
      if (!nameValidation.success) {
        toast.error(nameValidation.error)
        setSubmitting(false)
        return
      }

      const totalAmountValidation = validateNumberField(formData.total_amount, 'Total amount', true)
      if (!totalAmountValidation.success) {
        toast.error(totalAmountValidation.error)
        setSubmitting(false)
        return
      }

      const balanceValidation = validateNumberField(formData.outstanding_balance, 'Outstanding balance', true)
      if (!balanceValidation.success) {
        toast.error(balanceValidation.error)
        setSubmitting(false)
        return
      }

      const emiValidation = validateNumberField(formData.emi_amount, 'EMI amount', true)
      if (!emiValidation.success) {
        toast.error(emiValidation.error)
        setSubmitting(false)
        return
      }

      const durationValidation = validateNumberField(formData.duration_months, 'Duration', true)
      if (!durationValidation.success) {
        toast.error(durationValidation.error)
        setSubmitting(false)
        return
      }

      // Create loan data with validated numbers
      const loanData = {
        name: formData.name,
        total_amount: totalAmountValidation.value,
        outstanding_balance: balanceValidation.value,
        emi_amount: emiValidation.value,
        start_date: formData.start_date,
        duration_months: Math.round(durationValidation.value), // Ensure it's an integer
      }

      if (editingLoan) {
        await updateLoan(editingLoan.id, loanData)
        toast.success('Loan updated successfully!')
      } else {
        await createLoan(loanData)
        toast.success('Loan created successfully!')
      }
      
      setFormOpen(false)
      setEditingLoan(null)
      setFormData({
        name: '',
        total_amount: '',
        outstanding_balance: '',
        emi_amount: '',
        start_date: new Date().toISOString().split('T')[0],
        duration_months: '',
      })
      fetchLoans()
    } catch (error) {
      console.error('Failed to save loan:', error)
      toast.error('Failed to save loan. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan)
    setFormData({
      name: loan.name,
      total_amount: loan.total_amount,
      outstanding_balance: loan.outstanding_balance,
      emi_amount: loan.emi_amount,
      start_date: loan.start_date,
      duration_months: loan.duration_months,
    })
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      try {
        await deleteLoan(id)
        toast.success('Loan deleted successfully!')
        fetchLoans()
      } catch (error) {
        console.error('Failed to delete loan:', error)
        toast.error('Failed to delete loan. Please try again.')
      }
    }
  }

  const calculateProgress = (total: number, outstanding: number) => {
    const paid = total - outstanding
    return total > 0 ? (paid / total) * 100 : 0
  }

  const totalDebt = loans.reduce((sum, loan) => sum + loan.outstanding_balance, 0)
  const totalOriginal = loans.reduce((sum, loan) => sum + loan.total_amount, 0)

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
          Loans
        </motion.h1>
        <motion.div variants={itemVariants}>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  setEditingLoan(null)
                  setFormData({
                    name: '',
                    total_amount: 0,
                    outstanding_balance: 0,
                    emi_amount: 0,
                    start_date: new Date().toISOString().split('T')[0],
                    duration_months: 12,
                  })
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Loan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingLoan ? 'Edit Loan' : 'Add New Loan'}
                </DialogTitle>
                <DialogDescription>
                  {editingLoan 
                    ? 'Update your loan information.'
                    : 'Add a new loan to track your debt.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Loan Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Home Loan, Car Loan"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Total Amount</Label>
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: handleNumberInput(e.target.value) })}
                      placeholder="Enter total loan amount"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outstanding_balance">Outstanding Balance</Label>
                    <Input
                      id="outstanding_balance"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.outstanding_balance}
                      onChange={(e) => setFormData({ ...formData, outstanding_balance: handleNumberInput(e.target.value) })}
                      placeholder="Enter outstanding balance"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emi_amount">EMI Amount</Label>
                    <Input
                      id="emi_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.emi_amount}
                      onChange={(e) => setFormData({ ...formData, emi_amount: handleNumberInput(e.target.value) })}
                      placeholder="Enter EMI amount"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_months">Duration (Months)</Label>
                    <Input
                      id="duration_months"
                      type="number"
                      min="1"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({ ...formData, duration_months: handleNumberInput(e.target.value) })}
                      placeholder="Enter duration in months"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
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
                    {submitting ? 'Saving...' : editingLoan ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      <div className="p-4 lg:p-8 space-y-6">
        {/* Summary Cards */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Total Loans</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xl sm:text-2xl font-bold">{loans.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Total Debt</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xl sm:text-2xl font-bold text-red-400">
                  {formatCurrency(totalDebt)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xl sm:text-2xl font-bold text-green-400">
                  {formatCurrency(totalOriginal - totalDebt)}
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Loans Grid */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {loans.map((loan) => {
              const progress = calculateProgress(loan.total_amount, loan.outstanding_balance)
              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center min-w-0 flex-1">
                          <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6 text-destructive mr-2 flex-shrink-0" />
                          <h3 className="font-semibold text-base sm:text-lg truncate">{loan.name}</h3>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(loan)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(loan.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Outstanding</span>
                          <span className="font-semibold text-red-400 text-sm sm:text-base">
                            {formatCurrency(loan.outstanding_balance)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">EMI</span>
                          <span className="font-semibold text-sm sm:text-base">
                            {formatCurrency(loan.emi_amount)}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className="bg-green-400 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Loans Table */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Loans</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left min-w-[120px]">Name</TableHead>
                      <TableHead className="text-right min-w-[100px]">Total Amount</TableHead>
                      <TableHead className="text-right min-w-[100px]">Outstanding</TableHead>
                      <TableHead className="text-right min-w-[80px]">EMI</TableHead>
                      <TableHead className="text-left hidden sm:table-cell min-w-[80px]">Duration</TableHead>
                      <TableHead className="text-center hidden md:table-cell min-w-[120px]">Progress</TableHead>
                      <TableHead className="text-center min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {loans.map((loan) => {
                  const progress = calculateProgress(loan.total_amount, loan.outstanding_balance)
                  return (
                    <TableRow key={loan.id}>
                      <TableCell className="px-4">
                        <div className="flex items-center space-x-2 min-w-0">
                          <PiggyBank className="w-4 h-4 text-destructive flex-shrink-0" />
                          <span className="truncate text-sm">{loan.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium px-2 text-sm">
                        {formatCurrency(loan.total_amount)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-400 px-2 text-sm">
                        {formatCurrency(loan.outstanding_balance)}
                      </TableCell>
                      <TableCell className="text-right font-medium px-2 text-sm">
                        {formatCurrency(loan.emi_amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm px-2">
                        {loan.duration_months} months
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-16 bg-secondary rounded-full h-2">
                            <div
                              className="bg-green-400 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm">{progress.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-2">
                        <div className="flex items-center justify-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(loan)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDelete(loan.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
              </div>
              {loans.length === 0 && (
                <div className="text-center py-8 text-muted-foreground px-4">
                  No loans found. Add a loan to start tracking your debt.
                </div>
              )}
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </motion.div>
  )
}
