'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getUserPreferences, updateUserPreferences } from '@/lib/actions/preferences'
import { CURRENCIES, DEFAULT_CURRENCY } from '@/lib/currency'
import { Settings, Trash2 } from 'lucide-react'

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

export default function SettingsPage() {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY.code)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const preferences = await getUserPreferences()
        setCurrency(preferences.currency || DEFAULT_CURRENCY.code)
      } catch (error) {
        console.error('Failed to fetch preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPreferences()
  }, [])

  const handleCurrencyChange = async (newCurrency: string) => {
    setSaving(true)
    try {
      await updateUserPreferences({ currency: newCurrency })
      setCurrency(newCurrency)
      // Trigger a page refresh to update all currency displays
      window.location.reload()
    } catch (error) {
      console.error('Failed to update currency:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      // TODO: Implement actual account deletion logic
      console.log('Deleting account...')
      
      // For now, just simulate the action
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Redirect to login or home page after deletion
      window.location.href = '/login'
    } catch (error) {
      console.error('Failed to delete account:', error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
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
      className="p-6 space-y-6"
    >
      <div className="flex items-center">
        <motion.h1 
          variants={itemVariants}
          className="text-3xl font-bold flex items-center"
        >
          <Settings className="w-8 h-8 mr-3 text-primary" />
          Settings
        </motion.h1>
      </div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:space-x-6">
              <div className="flex-1 space-y-1">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Default Currency
                </Label>
                <p className="text-sm text-muted-foreground">
                  This currency will be used throughout the application for displaying amounts.
                </p>
              </div>
              <div className="flex-shrink-0 w-full sm:w-[240px]">
                <Select
                  value={currency}
                  onValueChange={handleCurrencyChange}
                  disabled={saving}
                >
                  <SelectTrigger id="currency" className="w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 w-[240px]">
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-lg">{curr.symbol}</span>
                          <span>{curr.name} ({curr.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {saving && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <motion.div
                  animate={{
                    rotate: 360
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
                <span>Updating currency...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Application Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theme:</span>
                <span>Dark Mode</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Currency:</span>
                <span className="font-mono">
                  {CURRENCIES.find(c => c.code === currency)?.symbol} {currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 sm:space-x-6">
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full sm:w-auto whitespace-nowrap"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="text-destructive">
                        Are you absolutely sure?
                      </DialogTitle>
                      <DialogDescription>
                        This action cannot be reverted. This will permanently delete your
                        account and remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleting}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="w-full sm:w-auto"
                      >
                        {deleting ? (
                          <>
                            <motion.div
                              animate={{
                                rotate: 360
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                            />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Yes, delete account
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
