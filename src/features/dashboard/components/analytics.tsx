/**
 * API SPECIFICATION FOR BACKEND AI
 * =========================================================================================
 * Please generate an API endpoint to support the Analytics dashboard for "Ticket Codes".
 *
 * Endpoint: GET /api/stats/ticket-codes/analytics
 *
 * Query Parameters:
 * - startDate: string (ISO 8601 format, e.g., 2023-01-01)
 * - endDate: string (ISO 8601 format, e.g., 2023-01-31)
 * - granularity: 'day' | 'week' | 'month' (optional, default 'day')
 *
 * Expected Response Design:
 * {
 *   "summary": {
 *     "totalCount": number,          // Total ticket codes generated in the period
 *     "activeUsers": number,         // Count of distinct users who generated codes
 *     "averageTimeSeconds": number   // Average time taken to generate a code (optional, or send 0)
 *   },
 *   "chartData": [
 *     {
 *       "date": string,              // ISO date for the data point (bucket start)
 *       "count": number,             // Number of ticket codes
 *       "errors": number             // Number of failed generations (optional)
 *     }
 *   ],
 *   "shifts": {
 *     "morning": number,             // Count for Morning shift (e.g., 06:00 - 14:00)
 *     "afternoon": number,           // Count for Afternoon shift (e.g., 14:00 - 22:00)
 *     "night": number                // Count for Night shift (e.g., 22:00 - 06:00)
 *   }
 * }
 * =========================================================================================
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AnalyticsChart from './analytics-chart'
import { Activity, Users, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, subDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { DateRange } from 'react-day-picker'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'

export function Analytics() {
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month'>('day')
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<{
    summary: { totalCount: number, activeUsers: number, averageTimeSeconds: number },
    chartData: { date: string, count: number, errors: number }[],
    shifts: { morning: number, afternoon: number, night: number }
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!dateRange?.from) return

      const start = format(dateRange.from, 'yyyy-MM-dd')
      const end = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd')

      setIsLoading(true)
      try {
        const res = await fetch(`http://localhost:8080/api/stats/ticket-codes/analytics?startDate=${start}&endDate=${end}&granularity=${granularity}`, {
          credentials: 'include'
        })

        if (!res.ok) throw new Error('Failed to fetch analytics')

        const jsonData = await res.json()
        setData(jsonData)
      } catch (error) {
        console.error(error)
        toast.error('Failed to load analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange, granularity])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const shiftData = data ? [
    { name: 'Morning', tickets: data.shifts.morning, color: '#0ea5e9' },
    { name: 'Afternoon', tickets: data.shifts.afternoon, color: '#f59e0b' },
    { name: 'Night', tickets: data.shifts.night, color: '#8b5cf6' },
  ] : []

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div variants={item}>
        <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-br from-muted/30 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Ticket Generation Analytics</CardTitle>
                <CardDescription className="mt-1">
                  Breakdown of tickets generated by {granularity}.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className={cn('grid gap-2')}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={'outline'}
                      className={cn(
                        'w-[300px] justify-start text-left font-normal border-2 hover:border-primary/50 transition-colors',
                        !dateRange && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-2 shadow-xl" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Tabs value={granularity} onValueChange={(v) => setGranularity(v as 'day' | 'week' | 'month')}>
                <TabsList className="border-2">
                  <TabsTrigger value="day" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80">Day</TabsTrigger>
                  <TabsTrigger value="week" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80">Week</TabsTrigger>
                  <TabsTrigger value="month" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="px-6 pt-6">
            {data && (
              <AnalyticsChart
                stats={data.chartData}
                granularity={granularity}
                dateRange={dateRange}
              />
            )}
            {!data && isLoading && (
              <div className="h-[400px] w-full flex flex-col items-center justify-center text-muted-foreground">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="font-medium">Loading analytics...</p>
              </div>
            )}
            {!data && !isLoading && (
              <div className="h-[400px] w-full flex flex-col items-center justify-center text-muted-foreground">
                <CalendarIcon className="h-16 w-16 mb-4 text-muted-foreground/50" />
                <p className="font-medium">Select a date range to view analytics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <motion.div variants={item} className="col-span-4">
          <Card className="h-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500"></div>
            <CardHeader className="bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/30">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Production by Shift</CardTitle>
                  <CardDescription className="mt-1">
                    Ticket generation distribution across shifts (Morning, Afternoon, Night).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pl-2 pt-6">
              {data ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={shiftData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      {shiftData.map((entry, index) => (
                        <linearGradient key={`gradient-${index}`} id={`shiftGradient-${index}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={entry.color} stopOpacity={1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 13, fill: 'hsl(var(--foreground))', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '2px solid hsl(var(--border))',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        backgroundColor: 'hsl(var(--background))'
                      }}
                    />
                    <Bar dataKey="tickets" radius={[0, 8, 8, 0]} barSize={40} animationDuration={1500}>
                      {shiftData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#shiftGradient-${index})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <p>Loading...</p>
                    </div>
                  ) : (
                    'No data available'
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} className="col-span-3">
          <Card className="h-full shadow-xl hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
            <CardHeader className="bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/30">
                  <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Key Metrics</CardTitle>
                  <CardDescription className="mt-1">
                    Summary of performance indicators.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 border border-blue-200/50 dark:border-blue-800/50 transition-all hover:shadow-md">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 shadow-lg">
                  <Activity className="text-white h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-semibold text-foreground">Total Tickets</p>
                  <p className="text-xs text-muted-foreground">
                    Generated in selected period
                  </p>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  {data?.summary.totalCount.toLocaleString() || 0}
                </div>
              </div>
              <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10 border border-green-200/50 dark:border-green-800/50 transition-all hover:shadow-md">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl mr-4 shadow-lg">
                  <Users className="text-white h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-semibold text-foreground">Active Generators</p>
                  <p className="text-xs text-muted-foreground">
                    Unique users active
                  </p>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent">
                  {data?.summary.activeUsers.toLocaleString() || 0}
                </div>
              </div>
              <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-950/10 border border-purple-200/50 dark:border-purple-800/50 transition-all hover:shadow-md">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl mr-4 shadow-lg">
                  <Clock className="text-white h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-semibold text-foreground">Avg. Time</p>
                  <p className="text-xs text-muted-foreground">
                    Per ticket generation
                  </p>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-br from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  {data?.summary.averageTimeSeconds || 0}s
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Analytics
