'use client'

import { CurrencyProvider } from '@/contexts/currency-context'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem={true}
      disableTransitionOnChange
    >
      <CurrencyProvider>
        {children}
        <Toaster />
      </CurrencyProvider>
    </ThemeProvider>
  )
}
