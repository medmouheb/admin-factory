import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import Analytics from './components/analytics'
import Overview from './components/overview'
import RecentSales from './components/recent-sales'
import { ProductionMetrics } from './components/production-metrics'
import { RecentActivity } from './components/recent-activity'
import { useAuthStore } from '@/stores/auth-store'
import { FileText, Users, Activity, AlertCircle, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { format, subDays } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function Dashboard() {
  const { user } = useAuthStore((state) => state.auth)
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalTickets: 0,
    ticketsToday: 0,
    activeUsers: 0,
    failedGenerations: 0,
    parts: 0,
    materials: 0
  })

  const [ticketsByDate, setTicketsByDate] = useState<{ date: string; count: number }[]>([])
  const [leaderboardData, setLeaderboardData] = useState<{ matricule: string; count: number }[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Dashboard Summary
        const dashRes = await fetch('http://localhost:8080/api/stats/dashboard', { credentials: 'include' })
        const dashData = await dashRes.json()

        if (dashData) {
          setStats({
            totalTickets: dashData.counts.tickets || 0,
            ticketsToday: 0, // Not provided directly in summary, would need calculation or another endpoint
            activeUsers: dashData.counts.users || 0,
            failedGenerations: 0, // Not provided
            parts: dashData.counts.parts || 0,
            materials: dashData.counts.materials || 0
          })
          setRecentActivity(dashData.recentActivity || [])
        }

        // Fetch Tickets By Date
        const ticketsRes = await fetch('http://localhost:8080/api/stats/tickets/by-date', { credentials: 'include' })
        const ticketsData = await ticketsRes.json()
        setTicketsByDate(ticketsData || [])

        // Fetch Leaderboard
        const lbRes = await fetch('http://localhost:8080/api/stats/ticket-codes/by-matricule', { credentials: 'include' })
        const lbData = await lbRes.json()
        setLeaderboardData(lbData || [])

        // Keep fetching users for names mapping
        const usersRes = await fetch('http://localhost:8080/api/users/search?page=1&size=1000', { credentials: 'include' })
        const usersJson = await usersRes.json()
        setUsers(usersJson.users || [])

      } catch (error) {
        console.error(error)
        toast.error('Failed to load dashboard data')
      }
    }
    fetchData()
  }, [])

  const downloadReport = async () => {
    try {
      toast.info('Generating report...')
      const doc = new jsPDF()
      const today = new Date()
      // Default to last 30 days for the report to match default analytics view
      const thirtyDaysAgo = subDays(today, 30)
      const start = format(thirtyDaysAgo, 'yyyy-MM-dd')
      const end = format(today, 'yyyy-MM-dd')

      // Fetch Analytics Data for the report
      const res = await fetch(`http://localhost:8080/api/stats/ticket-codes/analytics?startDate=${start}&endDate=${end}&granularity=day`, {
        credentials: 'include'
      })
      const analyticsData = await res.json()

      // Title
      doc.setFontSize(22)
      doc.setTextColor(40, 40, 40)
      doc.text('Dashboard Report', 14, 20)

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on ${format(today, 'PPP')} - Period: Last 30 Days`, 14, 28)

      let yPos = 35

      // 1. General Overview Section
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('1. General Overview', 14, yPos)
      yPos += 6

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Tickets (All Time)', stats.totalTickets.toLocaleString()],
          ['Active Users (All Time)', stats.activeUsers.toLocaleString()],
          ['Total Parts', stats.parts.toLocaleString()],
          ['Total Materials', stats.materials.toLocaleString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 10 }
      })

      // @ts-ignore
      yPos = doc.lastAutoTable.finalY + 15

      // 2. Analytics Performance Section
      if (analyticsData && analyticsData.summary) {
        doc.setFontSize(14)
        doc.text('2. Performance Metrics (Last 30 Days)', 14, yPos)
        yPos += 6

        autoTable(doc, {
          startY: yPos,
          head: [['Metric', 'Value']],
          body: [
            ['Tickets Generated', analyticsData.summary.totalCount.toLocaleString()],
            ['Active Generators', analyticsData.summary.activeUsers.toLocaleString()],
            ['Avg. Generation Time', `${analyticsData.summary.averageTimeSeconds}s`],
          ],
          theme: 'grid',
          headStyles: { fillColor: [39, 174, 96] },
          styles: { fontSize: 10 }
        })
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15
      }

      // 3. Shift Production Section
      if (analyticsData && analyticsData.shifts) {
        doc.setFontSize(14)
        doc.text('3. Production by Shift', 14, yPos)
        yPos += 6

        const total = analyticsData.shifts.morning + analyticsData.shifts.afternoon + analyticsData.shifts.night

        autoTable(doc, {
          startY: yPos,
          head: [['Shift', 'Tickets Generated', 'Share']],
          body: [
            ['Morning', analyticsData.shifts.morning.toLocaleString(), total ? `${((analyticsData.shifts.morning / total) * 100).toFixed(1)}%` : '0%'],
            ['Afternoon', analyticsData.shifts.afternoon.toLocaleString(), total ? `${((analyticsData.shifts.afternoon / total) * 100).toFixed(1)}%` : '0%'],
            ['Night', analyticsData.shifts.night.toLocaleString(), total ? `${((analyticsData.shifts.night / total) * 100).toFixed(1)}%` : '0%'],
          ],
          theme: 'striped',
          headStyles: { fillColor: [211, 84, 0] },
          styles: { fontSize: 10 }
        })
        // @ts-ignore
        yPos = doc.lastAutoTable.finalY + 15
      }

      // 4. Daily Breakdown Section
      if (analyticsData && analyticsData.chartData && analyticsData.chartData.length > 0) {
        if (yPos > 250) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(14)
        doc.text('4. Daily Breakdown', 14, yPos)
        yPos += 6

        const rows = analyticsData.chartData.map((item: any) => [
          format(new Date(item.date), 'yyyy-MM-dd'),
          item.count,
          item.errors
        ])

        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Tickets', 'Errors']],
          body: rows,
          theme: 'plain',
          headStyles: { fillColor: [142, 68, 173] },
          styles: { fontSize: 9 }
        })
      }

      doc.save('detailed-dashboard-report.pdf')
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to generate report')
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.totalTickets.toLocaleString(),
      change: '',
      trend: 'neutral',
      period: 'All time',
      icon: FileText,
      iconBg: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Total Parts',
      value: stats.parts.toLocaleString(),
      change: '',
      trend: 'neutral',
      period: 'All time',
      icon: Activity,
      iconBg: 'bg-teal-50 dark:bg-teal-950/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '',
      trend: 'neutral',
      period: 'All time',
      icon: Users,
      iconBg: 'bg-amber-50 dark:bg-amber-950/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Materials',
      value: stats.materials.toLocaleString(),
      change: '',
      trend: 'neutral',
      period: 'All time',
      icon: AlertCircle,
      iconBg: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ]

  return (
    <Main className="p-4 md:p-6 lg:p-8">
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Dashboard
          </h1>
          <p className='text-muted-foreground mt-1'>
            Welcome back, <span className="font-medium text-foreground">{user?.firstName} {user?.lastName}</span>
          </p>
        </div>
        <Button onClick={downloadReport} className="shadow-sm hover:shadow-md transition-all">
          <Download className='mr-2 h-4 w-4' />
          Download Report
        </Button>
      </div>

      <Tabs
        orientation='vertical'
        defaultValue='overview'
        className='space-y-6'
      >
        <div className='w-full overflow-x-auto pb-2'>
          <TabsList className="bg-muted/50">
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='reports' disabled>
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='overview' className='space-y-6'>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
          >
            {statCards.map((stat, index) => (
              <motion.div key={stat.title} variants={item}>
                <Card className="relative overflow-hidden hover:shadow-md transition-all duration-300 border-border/50">
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <div className="space-y-0">
                      <CardTitle className='text-sm font-medium text-muted-foreground'>
                        {stat.title}
                      </CardTitle>
                    </div>
                    <div className={`p-2.5 rounded-lg ${stat.iconBg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className='text-2xl font-bold tracking-tight'>{stat.value}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-0.5 font-medium ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' :
                        stat.trend === 'down' ? 'text-red-600 dark:text-red-400' :
                          'text-muted-foreground'
                        }`}>
                        {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                        {stat.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                        {stat.trend === 'neutral' && <Minus className="h-3 w-3" />}
                        {stat.change}
                      </span>
                      <span className="text-muted-foreground">{stat.period}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='col-span-1 lg:col-span-8 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Generation Overview</CardTitle>
                <CardDescription>
                  Monthly breakdown of generated tickets vs failed attempts.
                </CardDescription>
              </CardHeader>
              <CardContent className='ps-2'>
                <Overview stats={ticketsByDate} />
              </CardContent>
            </Card>

          </div>

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='col-span-1 lg:col-span-4 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle className="text-lg">User Leaderboard</CardTitle>
                <CardDescription>
                  Top performers by ticket generation score.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales users={users} leaderboardData={leaderboardData} />
              </CardContent>
            </Card>
            <Card className='col-span-1 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>
                  Latest system events and user actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity activities={recentActivity} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value='analytics' className='space-y-4'>
          <Analytics />
        </TabsContent>
      </Tabs>
    </Main>
  )
}
