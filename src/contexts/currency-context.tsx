'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Currency, DEFAULT_CURRENCY, getCurrencyByCode } from '@/lib/currency'
import { getUserPreferences } from '@/lib/actions/preferences'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatCurrency: (amount: number) => string
  reloadPreferences: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(DEFAULT_CURRENCY)

  const loadCurrency = async () => {
    try {
      const preferences = await getUserPreferences()
      const currencyCode = preferences.currency || DEFAULT_CURRENCY.code
      setCurrencyState(getCurrencyByCode(currencyCode))
    } catch (error) {
      // Silently fall back to default currency
      setCurrencyState(DEFAULT_CURRENCY)
    }
  }

  useEffect(() => {
    loadCurrency()
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
  }

  const reloadPreferences = async () => {
    await loadCurrency()
  }

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
      }).format(amount)
    } catch (error) {
      // Fallback if Intl.NumberFormat fails
      return `${currency.symbol}${amount.toLocaleString()}`
    }
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, reloadPreferences }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
