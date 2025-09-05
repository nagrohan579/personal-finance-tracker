# Personal Finance Tracker

A comprehensive personal finance management application built with Next.js 15 and Supabase, featuring complete data encryption and automated financial tracking capabilities.

## 🌐 Try the Application

Experience the application live at: **[https://personal-finance-tracker-chi-ten.vercel.app/](https://personal-finance-tracker-chi-ten.vercel.app/)**

Create an account to start managing your finances with complete privacy and security.

## ✨ Key Features

### 🔐 Complete Data Privacy
- **AES-256-GCM Encryption**: All sensitive financial data is encrypted at rest
- **Per-user encryption keys**: Each user has their own unique encryption key
- **Server-side security**: Encryption keys never exposed to the client
- **Supabase dashboard privacy**: Your data appears encrypted even to database administrators

### 💰 Financial Account Management
- Create and manage multiple financial accounts (Savings, Credit Cards, Cash, Wallets)
- Real-time balance tracking with automatic calculations
- Account type categorization with intuitive icons
- Responsive design optimized for both desktop and mobile

### 📊 Transaction Tracking
- Record income, expenses, investments, and transfers
- Category-based organization for better insights
- Advanced filtering and search capabilities
- Transfer tracking between your own accounts
- Visual transaction history with color-coded types

### 📈 Dashboard Analytics
- Real-time financial overview with key metrics
- Interactive expense charts and category breakdowns
- Monthly expense tracking with historical data
- Net worth calculations including debt considerations
- Recent transaction activity feed

### 🔄 Recurring Transactions *(Current Feature)*
- Convert any transaction to recurring by simply checking a box
- Choose frequency: Monthly or Annually
- Automated server-side cron jobs create transactions automatically
- Smart scheduling based on your selected dates
- Full management of recurring transaction schedules

### 🏦 Loan Management *(Current Feature)*
- Track multiple loans with detailed information
- Monitor total amounts, outstanding balances, and EMI details
- Independent loan tracking (currently not connected to accounts)

## 🚀 Upcoming Features

### 🔄 Enhanced Recurring Transactions
- **Smart Automation**: When adding any normal transaction, simply check the "Make this recurring" box
- **Flexible Scheduling**: Choose between Monthly or Annual recurring patterns
- **Server Automation**: Cron jobs automatically create future transactions based on your schedule
- **Date Intelligence**: Transactions repeat on the same day each month/year as specified

### 💳 Connected Loan Management
- **Account Integration**: Connect loans directly to your financial accounts
- **Flexible Payment Options**:
  - **EMI Payments**: Choose monthly or annual EMI deductions
  - **Lump Sum Payments**: Make one-time payments towards your loans
  - **Auto Deduction**: Payments automatically deduct from selected accounts
  - **Balance Updates**: Account balances update in real-time with loan payments
- **Payment History**: Track all loan payments and remaining balances
- **Smart Scheduling**: Set up automatic EMI deductions on specific dates

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Runtime**: React 19
- **Styling**: Tailwind CSS v4 with custom design system
- **UI Components**: Radix UI primitives for accessibility
- **Animations**: Motion (Framer Motion) for smooth interactions
- **Icons**: Lucide React icon library
- **Theme**: Dark/light mode support with next-themes

### Backend & Database
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with SSR support
- **API**: Next.js Server Actions for type-safe data mutations
- **Encryption**: Custom AES-256-GCM implementation
- **Charts**: Recharts for interactive data visualization

### Security & Performance
- **Row Level Security**: Database-level access control
- **Server-side rendering**: Optimized for performance and SEO
- **Type safety**: Full TypeScript implementation
- **Responsive design**: Mobile-first approach
- **Real-time updates**: Live data synchronization

## 🎯 Use Cases

- **Personal Finance Management**: Track all your income, expenses, and investments
- **Budget Planning**: Analyze spending patterns with detailed categorization
- **Multi-account Management**: Handle multiple bank accounts, credit cards, and cash
- **Automated Tracking**: Set up recurring transactions for regular income/expenses
- **Debt Management**: Monitor loans and plan repayment strategies
- **Financial Privacy**: Keep your financial data completely private and encrypted

## 🔒 Privacy & Security

This application prioritizes your financial privacy:
- All sensitive data is encrypted before being stored
- Your encryption key is unique and never shared
- Even database administrators cannot see your actual financial data
- Server-side encryption ensures client-side security
- Complete compliance with data privacy best practices

## 🌟 Getting Started

1. Visit [https://personal-finance-tracker-chi-ten.vercel.app/login](https://personal-finance-tracker-chi-ten.vercel.app/login)
2. Create your secure account with email verification
3. Add your first financial account
4. Start tracking transactions and building your financial overview
5. Set up recurring transactions for automated tracking
6. Explore the dashboard for insights into your financial health

---

**Built with privacy, security, and user experience as top priorities.**