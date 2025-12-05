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
import { FileText, Users, Activity, AlertCircle, Download } from 'lucide-react'
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
        const totalTickets = fetchedUsers.length // Assuming 1 user = 1 ticket for now as per previous logic, or we mock it
        // Actually, let's mock tickets count based on users for now as we don't have a tickets endpoint yet
        // In a real app, we would fetch tickets count
        
        // Mocking ticket counts for stats
        let todayCount = 0
        let activeCount = 0
        
        fetchedUsers.forEach((u: any) => {
          const userDate = new Date(u.updatedAt)
          if (isSameDay(userDate, today)) {
            todayCount++
          }
          // Active in last 30 days
          if (userDate > subMonths(today, 1)) {
            activeCount++
          }
        })

        setStats({
          totalTickets: totalTickets * 12, // Mock multiplier
          ticketsToday: todayCount * 5 + 12, // Mock multiplier
          activeUsers: activeCount,
          failedGenerations: Math.floor(totalTickets * 0.02) // Mock 2% failure
        })

      } catch (error) {
        console.error(error)
        toast.error('Failed to load dashboard data')
      } finally {
        // setLoading(false)
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
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <Main>
      <div className='mb-2 flex items-center justify-between space-y-2'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
            Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Welcome back, <span className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</span>
          </p>
        </div>
        <div className='flex items-center space-x-2'>
          <Button onClick={downloadReport} className="shadow-lg hover:shadow-xl transition-all duration-300">
            <Download className='mr-2 h-4 w-4' />
            Download Report
          </Button>
        </div>
      </div>
      <Tabs
        orientation='vertical'
        defaultValue='overview'
        className='space-y-4'
      >
        <div className='w-full overflow-x-auto pb-2'>
          <TabsList className="bg-background/50 backdrop-blur-sm border">
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='reports' disabled>
              Reports
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value='overview' className='space-y-4'>
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
          >
            <motion.div variants={item}>
              <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Tickets
                  </CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <FileText className='text-blue-600 dark:text-blue-400 h-4 w-4' />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{stats.totalTickets.toLocaleString()}</div>
                  <p className='text-muted-foreground text-xs'>
                    <span className="text-green-500 font-medium">↑ 19%</span> from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-green-500">
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Tickets Today
                  </CardTitle>
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                    <Activity className='text-green-600 dark:text-green-400 h-4 w-4' />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>+{stats.ticketsToday}</div>
                  <p className='text-muted-foreground text-xs'>
                    <span className="text-green-500 font-medium">↑ 12%</span> since yesterday
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-purple-500">
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                    <Users className='text-purple-600 dark:text-purple-400 h-4 w-4' />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>+{stats.activeUsers}</div>
                  <p className='text-muted-foreground text-xs'>
                    <span className="text-green-500 font-medium">↑ 4%</span> new users this month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={item}>
              <Card className="hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-red-500">
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Failed Generations
                  </CardTitle>
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                    <AlertCircle className='text-red-600 dark:text-red-400 h-4 w-4' />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>{stats.failedGenerations}</div>
                  <p className='text-muted-foreground text-xs'>
                    <span className="text-green-500 font-medium">↓ 1%</span> from last month
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
          
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
            <Card className='col-span-1 lg:col-span-4 hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle>Ticket Generation Overview</CardTitle>
                <CardDescription>
                  Monthly breakdown of generated tickets vs failed attempts.
                </CardDescription>
              </CardHeader>
              <CardContent className='ps-2'>
                <Overview users={users} />
              </CardContent>
            </Card>
            <Card className='col-span-1 lg:col-span-3 hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle>Production Targets</CardTitle>
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
             <Card className='col-span-1 lg:col-span-4 hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle>User Leaderboard</CardTitle>
                <CardDescription>
                  Top performers by ticket generation score.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales users={users} />
              </CardContent>
            </Card>
            <Card className='col-span-1 lg:col-span-3 hover:shadow-md transition-shadow duration-300'>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
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
