'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
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
import { deleteUserAccount } from '@/lib/actions/auth'
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
  const [accountDeleting, setAccountDeleting] = useState(false)

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
    console.log('🔥 CLIENT: About to call deleteUserAccount server action')
    setDeleting(true)
    setDeleteDialogOpen(false) // Close dialog immediately
    setAccountDeleting(true) // Show full-screen overlay
    
    try {
      console.log('🔥 CLIENT: Calling deleteUserAccount...')
      await deleteUserAccount()
      console.log('🔥 CLIENT: deleteUserAccount completed successfully')
      
      // Don't show toast since we're redirecting
      console.log('🔥 CLIENT: Account deletion successful, clearing everything...')
      
      // Aggressively clear all client-side data
      console.log('🔥 CLIENT: Aggressively clearing all client-side data')
      
      // Clear storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear all cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=")
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      })
      
      console.log('🔥 CLIENT: All data cleared, forcing hard redirect to login')
      
      // Force hard redirect with no history
      window.location.replace('/login')
    } catch (error) {
      console.log('🔥 CLIENT: deleteUserAccount threw error:', error)
      console.error('Failed to delete account:', error)
      // Show error message to user
      toast.error('Failed to delete account. Please try again.')
      
      // Reset states on error
      setAccountDeleting(false)
      setDeleting(false)
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
    <>
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

    {/* Full-screen overlay during account deletion */}
    {accountDeleting && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-6">
              <motion.div
                animate={{
                  rotate: 360
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
              />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Deleting Account</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we permanently delete your account and all associated data.
                  This may take a few moments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </>
  )
}
