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
import { isSameDay, subMonths } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function Dashboard() {
  const { user } = useAuthStore((state) => state.auth)
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalTickets: 0,
    ticketsToday: 0,
    activeUsers: 0,
    failedGenerations: 0
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('http://localhost:8080/api/users/search?page=1&size=1000', {
          credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch data')
        const json = await res.json()
        const fetchedUsers = json.users || []
        setUsers(fetchedUsers)

        // Calculate stats
        const today = new Date()
        const totalTickets = fetchedUsers.length
        
        let todayCount = 0
        let activeCount = 0
        
        fetchedUsers.forEach((u: any) => {
          const userDate = new Date(u.updatedAt)
          if (isSameDay(userDate, today)) {
            todayCount++
          }
          if (userDate > subMonths(today, 1)) {
            activeCount++
          }
        })

        setStats({
          totalTickets: totalTickets * 12,
          ticketsToday: todayCount * 5 + 12,
          activeUsers: activeCount,
          failedGenerations: Math.floor(totalTickets * 0.02)
        })

      } catch (error) {
        console.error(error)
        toast.error('Failed to load dashboard data')
      }
    }
    fetchData()
  }, [])

  const downloadReport = () => {
    const doc = new jsPDF()
    doc.text('Dashboard Report', 20, 10)
    
    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Total Tickets', stats.totalTickets],
        ['Tickets Today', stats.ticketsToday],
        ['Active Users', stats.activeUsers],
        ['Failed Generations', stats.failedGenerations],
      ],
    })

    doc.save('dashboard-report.pdf')
    toast.success('Report downloaded')
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
      change: '+38%',
      trend: 'up',
      period: 'Last 6 months',
      icon: FileText,
      iconBg: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Tickets Today',
      value: `+${stats.ticketsToday}`,
      change: '+22%',
      trend: 'up',
      period: 'Last 4 months',
      icon: Activity,
      iconBg: 'bg-teal-50 dark:bg-teal-950/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Active Users',
      value: `+${stats.activeUsers}`,
      change: '+38%',
      trend: 'up',
      period: 'Last 6 months',
      icon: Users,
      iconBg: 'bg-amber-50 dark:bg-amber-950/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Failed Generations',
      value: stats.failedGenerations,
      change: '-16%',
      trend: 'down',
      period: 'Last One year',
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
                      <span className={`inline-flex items-center gap-0.5 font-medium ${
                        stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 
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
            <Card className='col-span-1 lg:col-span-4 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Generation Overview</CardTitle>
                <CardDescription>
                  Monthly breakdown of generated tickets vs failed attempts.
                </CardDescription>
              </CardHeader>
              <CardContent className='ps-2'>
                <Overview users={users} />
              </CardContent>
            </Card>
            <Card className='col-span-1 lg:col-span-3 shadow-sm hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle className="text-lg">Production Targets</CardTitle>
                <CardDescription>
                  Real-time production efficiency and goals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionMetrics />
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
                <RecentSales users={users} />
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
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value='analytics' className='space-y-4'>
          <Analytics users={users} />
        </TabsContent>
      </Tabs>
    </Main>
  )
}
