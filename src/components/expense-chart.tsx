"use client"

import * as React from "react"
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell,
  Line,
  LineChart,
  Pie, 
  PieChart, 
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Chart colors that work well in both light and dark mode
const CHART_COLORS = {
  light: {
    food: "#f97316",      // Orange 500
    transport: "#3b82f6", // Blue 500
    entertainment: "#8b5cf6", // Violet 500
    shopping: "#10b981",  // Emerald 500
    utilities: "#f59e0b", // Amber 500
    healthcare: "#ef4444", // Red 500
    education: "#06b6d4",  // Cyan 500
    personal: "#8b5cf6",   // Violet 500
    savings: "#059669",    // Emerald 600
    investment: "#7c3aed", // Violet 600
  },
  dark: {
    food: "#fb923c",      // Orange 400
    transport: "#60a5fa", // Blue 400
    entertainment: "#a78bfa", // Violet 400
    shopping: "#34d399",  // Emerald 400
    utilities: "#fbbf24", // Amber 400
    healthcare: "#f87171", // Red 400
    education: "#22d3ee",  // Cyan 400
    personal: "#a78bfa",   // Violet 400
    savings: "#10b981",    // Emerald 500
    investment: "#8b5cf6", // Violet 500
  }
}

// Example data - replace with your actual data
const mockData = [
  { month: "Jan", food: 850, transport: 420, entertainment: 280, shopping: 380 },
  { month: "Feb", food: 920, transport: 380, entertainment: 320, shopping: 420 },
  { month: "Mar", food: 780, transport: 460, entertainment: 180, shopping: 350 },
  { month: "Apr", food: 890, transport: 440, entertainment: 380, shopping: 480 },
  { month: "May", food: 950, transport: 400, entertainment: 420, shopping: 380 },
  { month: "Jun", food: 880, transport: 520, entertainment: 320, shopping: 440 },
]

type ChartType = "area" | "bar" | "line" | "pie"

interface ExpenseChartProps {
  expensesByCategory?: Record<string, number>
  monthlyData?: Array<{month: string; [category: string]: string | number}>
  currency?: string
  formatCurrency?: (amount: number) => string
}

export function ExpenseChart({ 
  expensesByCategory = {},
  monthlyData = [],
  currency = 'USD',
  formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
}: ExpenseChartProps) {
  const [chartType, setChartType] = React.useState<ChartType>("area")
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Check if dark mode is enabled
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(isDarkMode)
    }

    checkDarkMode()
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkDarkMode)
    }
  }, [])

  const colors = isDark ? CHART_COLORS.dark : CHART_COLORS.light

  // Transform expense data for charts
  const currentMonthCategories = Object.keys(expensesByCategory)
  const historicalCategories = monthlyData.length > 0 
    ? Array.from(new Set(monthlyData.flatMap(month => Object.keys(month).filter(key => key !== 'month'))))
    : []
  
  // Combine current month categories with historical ones
  const allCategoryKeys = new Set([...historicalCategories])
  currentMonthCategories.forEach(cat => {
    allCategoryKeys.add(cat.toLowerCase().replace(/\s+/g, ''))
  })
  
  const categories = currentMonthCategories.length > 0 
    ? currentMonthCategories 
    : historicalCategories.length > 0
      ? historicalCategories
      : ['food', 'transport', 'entertainment', 'shopping']

  const getCategoryColor = (category: string, index: number) => {
    const colorKeys = Object.keys(colors) as Array<keyof typeof colors>
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')
    
    // Try to match category to predefined colors with more comprehensive matching
    if (normalizedCategory.includes('food') || normalizedCategory.includes('dining') || 
        normalizedCategory.includes('grocery') || normalizedCategory.includes('restaurant') ||
        normalizedCategory.includes('meal') || normalizedCategory.includes('lunch') ||
        normalizedCategory.includes('dinner') || normalizedCategory.includes('breakfast')) {
      return colors.food
    }
    if (normalizedCategory.includes('transport') || normalizedCategory.includes('travel') || 
        normalizedCategory.includes('gas') || normalizedCategory.includes('car') ||
        normalizedCategory.includes('fuel') || normalizedCategory.includes('bus') ||
        normalizedCategory.includes('train') || normalizedCategory.includes('taxi') ||
        normalizedCategory.includes('uber') || normalizedCategory.includes('parking')) {
      return colors.transport
    }
    if (normalizedCategory.includes('entertainment') || normalizedCategory.includes('fun') || 
        normalizedCategory.includes('movie') || normalizedCategory.includes('game') ||
        normalizedCategory.includes('music') || normalizedCategory.includes('streaming') ||
        normalizedCategory.includes('netflix') || normalizedCategory.includes('spotify') ||
        normalizedCategory.includes('hobby') || normalizedCategory.includes('recreation')) {
      return colors.entertainment
    }
    if (normalizedCategory.includes('shopping') || normalizedCategory.includes('clothes') || 
        normalizedCategory.includes('retail') || normalizedCategory.includes('amazon') ||
        normalizedCategory.includes('store') || normalizedCategory.includes('purchase') ||
        normalizedCategory.includes('clothing') || normalizedCategory.includes('fashion')) {
      return colors.shopping
    }
    if (normalizedCategory.includes('utilities') || normalizedCategory.includes('bill') || 
        normalizedCategory.includes('electric') || normalizedCategory.includes('water') ||
        normalizedCategory.includes('internet') || normalizedCategory.includes('phone') ||
        normalizedCategory.includes('heating') || normalizedCategory.includes('gas')) {
      return colors.utilities
    }
    if (normalizedCategory.includes('health') || normalizedCategory.includes('medical') ||
        normalizedCategory.includes('doctor') || normalizedCategory.includes('pharmacy') ||
        normalizedCategory.includes('insurance') || normalizedCategory.includes('dental') ||
        normalizedCategory.includes('hospital') || normalizedCategory.includes('medicine')) {
      return colors.healthcare
    }
    if (normalizedCategory.includes('education') || normalizedCategory.includes('school') ||
        normalizedCategory.includes('course') || normalizedCategory.includes('book') ||
        normalizedCategory.includes('tuition') || normalizedCategory.includes('learning') ||
        normalizedCategory.includes('training') || normalizedCategory.includes('university')) {
      return colors.education
    }
    if (normalizedCategory.includes('personal') || normalizedCategory.includes('beauty') ||
        normalizedCategory.includes('haircut') || normalizedCategory.includes('spa') ||
        normalizedCategory.includes('salon') || normalizedCategory.includes('cosmetic')) {
      return colors.personal
    }
    if (normalizedCategory.includes('saving') || normalizedCategory.includes('emergency') ||
        normalizedCategory.includes('reserve') || normalizedCategory.includes('fund')) {
      return colors.savings
    }
    if (normalizedCategory.includes('investment') || normalizedCategory.includes('stock') ||
        normalizedCategory.includes('crypto') || normalizedCategory.includes('bond') ||
        normalizedCategory.includes('portfolio') || normalizedCategory.includes('trading')) {
      return colors.investment
    }
    
    // Fallback to cycling through available colors
    return colors[colorKeys[index % colorKeys.length]]
  }

  // Create normalized key mapping for consistent data access
  const categoryKeyMap = new Map<string, string>()
  categories.forEach(category => {
    const normalizedKey = category.toLowerCase().replace(/\s+/g, '')
    categoryKeyMap.set(category, normalizedKey)
  })

  const pieData = categories.map((category, index) => ({
    category,
    amount: expensesByCategory[category] || 0,
    fill: getCategoryColor(category, index),
  }))

  // Transform monthly data to ensure consistent key mapping
  const transformedChartData = monthlyData.map(monthItem => {
    const transformed: any = { month: monthItem.month }
    
    // For each category in our current categories list, find the corresponding value
    categories.forEach(category => {
      const normalizedKey = categoryKeyMap.get(category)!
      // Look for the value in the monthly data using the normalized key
      transformed[normalizedKey] = monthItem[normalizedKey] || 0
    })
    
    return transformed
  })

  // Use the transformed data or create fallback from current month
  let chartData = transformedChartData
  
  // If no historical data but we have current month data, create a single month entry
  if (chartData.length === 0 && Object.keys(expensesByCategory).length > 0) {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' })
    const currentMonthData: any = { month: currentMonth }
    
    categories.forEach(category => {
      const normalizedKey = categoryKeyMap.get(category)!
      currentMonthData[normalizedKey] = expensesByCategory[category] || 0
    })
    
    chartData = [currentMonthData]
  }

  // Debug logging
  React.useEffect(() => {
    console.log('Chart loaded with', categories.length, 'categories and', chartData.length, 'months of data')
  }, [categories, monthlyData, chartData, expensesByCategory, chartType])

  // Check if we have any data to display
  const hasData = (chartData.length > 0 && categories.length > 0) || 
                  (pieData.length > 0 && pieData.some(item => item.amount > 0))

  // Create chart config using normalized keys but original labels
  const chartConfig = categories.reduce((config, category, index) => {
    const key = categoryKeyMap.get(category) || category.toLowerCase().replace(/\s+/g, '')
    return {
      ...config,
      [key]: {
        label: category,
        color: getCategoryColor(category, index),
      }
    }
  }, {} as ChartConfig)

  const renderChart = () => {
    // For pie chart, we can always use current month data
    if (chartType === "pie") {
      return (
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={pieData}
            dataKey="amount"
            nameKey="category"
            innerRadius={60}
            strokeWidth={5}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend
            content={<ChartLegendContent />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
          />
        </PieChart>
      )
    }

    // For other charts, we need historical data
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-sm">No historical data available for trend charts</div>
        </div>
      )
    }

    switch (chartType) {
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            {categories.map((category, index) => {
              const key = categoryKeyMap.get(category) || category.toLowerCase().replace(/\s+/g, '')
              const color = getCategoryColor(category, index)
              return (
                <Area
                  key={key}
                  dataKey={key}
                  type="natural"
                  fill={color}
                  fillOpacity={0.4}
                  stroke={color}
                  stackId="a"
                />
              )
            })}
          </AreaChart>
        )

      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            {categories.map((category, index) => {
              const key = categoryKeyMap.get(category) || category.toLowerCase().replace(/\s+/g, '')
              const color = getCategoryColor(category, index)
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={color}
                  radius={4}
                />
              )
            })}
          </BarChart>
        )

      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            {categories.map((category, index) => {
              const key = categoryKeyMap.get(category) || category.toLowerCase().replace(/\s+/g, '')
              const color = getCategoryColor(category, index)
              return (
                <Line
                  key={key}
                  dataKey={key}
                  type="monotone"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              )
            })}
          </LineChart>
        )

      default:
        return (
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey={categoryKeyMap.get(categories[0]) || categories[0]?.toLowerCase().replace(/\s+/g, '') || 'food'}
              type="natural"
              fill={getCategoryColor(categories[0] || 'food', 0)}
              fillOpacity={0.4}
              stroke={getCategoryColor(categories[0] || 'food', 0)}
              stackId="a"
            />
          </AreaChart>
        )
    }
  }

  const getChartDescription = () => {
    switch (chartType) {
      case "area":
        return "Stacked area chart showing expense trends over time"
      case "bar":
        return "Bar chart comparing expenses across categories"
      case "line":
        return "Line chart showing expense trends for each category"
      case "pie":
        return "Pie chart showing expense distribution by category"
      default:
        return "Expense visualization"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Analysis</CardTitle>
        <CardDescription>
          {getChartDescription()}
        </CardDescription>
        <CardAction>
          <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
            <SelectTrigger className="w-40" size="sm">
              <SelectValue placeholder="Chart type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="area" className="rounded-lg">
                Area Chart
              </SelectItem>
              <SelectItem value="bar" className="rounded-lg">
                Bar Chart
              </SelectItem>
              <SelectItem value="line" className="rounded-lg">
                Line Chart
              </SelectItem>
              <SelectItem value="pie" className="rounded-lg">
                Pie Chart
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {hasData ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            {renderChart()}
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
            <div className="text-sm">No expense data available</div>
            <div className="text-xs mt-1">Add some expenses to see charts</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
