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


  const downloadReport = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    
    // Helper for Footer
    const addFooter = (data: any) => {
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text('Confidential - Factory Admin System', 14, pageHeight - 10)
        doc.text(`Page ${data.pageNumber}`, pageWidth - 14, pageHeight - 10, { align: 'right' })
    }

    // --- Page 1 Header ---
    doc.setFillColor(67, 56, 202) // Indigo 700
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.text('Performance Report', 14, 25)
    
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 20, { align: 'right' })
    doc.text(`By: ${user?.firstName} ${user?.lastName}`, pageWidth - 14, 26, { align: 'right' })
    doc.text('Status: Official Record', pageWidth - 14, 32, { align: 'right' })

    let finalY = 50

    // 1. Executive Summary
    doc.setFontSize(14)
    doc.setTextColor(67, 56, 202)
    doc.text('1. Executive Overview', 14, finalY)
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Key Metric', 'Performance', 'Target', 'Status']],
      body: [
        ['Total Tickets', stats.totalTickets.toLocaleString(), '-', 'Active'],
        ['Active Users', stats.activeUsers.toLocaleString(), '> 5', 'Healthy'],
        ['Parts Indexed', stats.parts.toLocaleString(), '100%', 'Stable'],
        ['Materials', stats.materials.toLocaleString(), '-', 'Available'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        3: { textColor: [34, 197, 94], fontStyle: 'bold' }
      },
      didDrawPage: addFooter
    })

    finalY = (doc as any).lastAutoTable.finalY + 20

    // 2. Production Trends
    doc.text('2. Production Trends (Last 7 Days)', 14, finalY)
    
    const trendData = ticketsByDate.slice(-7).reverse().map(item => [
        new Date(item.date).toLocaleDateString(),
        item.count,
        item.count > 50 ? 'High Activity' : (item.count > 20 ? 'Moderate' : 'Low')
    ])

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Date', 'Daily Volume', 'Activity Level']],
      body: trendData.length > 0 ? trendData : [['No recent data', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [234, 88, 12] }, // Orange 600
      didDrawPage: addFooter
    })

    finalY = (doc as any).lastAutoTable.finalY + 20

    // 3. Leaderboard
    doc.text('3. Operator Efficiency (Top 10)', 14, finalY)
    
    const lbRows = leaderboardData.slice(0, 10).map((item, index) => {
      const u = users.find((u) => u.matricule === item.matricule)
      return [
        `#${index + 1}`,
        u ? `${u.firstName} ${u.lastName}` : item.matricule,
        item.count.toLocaleString(),
        'Top Tier'
      ]
    })

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Rank', 'Operator', 'Tickets Created', 'Classification']],
      body: lbRows.length > 0 ? lbRows : [['-', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
      didDrawPage: addFooter
    })

    // 4. System Logs (New Page likely)
    doc.addPage()
    // Simple Header for Page 2
    doc.setFontSize(10)
    doc.setTextColor(150)
    doc.text('Detailed Logs - Continued', 14, 15)

    doc.setFontSize(14)
    doc.setTextColor(67, 56, 202)
    doc.text('4. Recent System Events', 14, 25)

    const activityRows = recentActivity.slice(0, 30).map((act) => [
      new Date(act.timestamp).toLocaleString(),
      act.action,
      act.model,
      act.matricule
    ])

    autoTable(doc, {
      startY: 30,
      head: [['Timestamp', 'Action Type', 'Subject', 'User ID']],
      body: activityRows.length > 0 ? activityRows : [['-', '-', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [75, 85, 99] }, // Gray 600
      styles: { fontSize: 8 },
      didDrawPage: addFooter
    })

    doc.save(`Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Comprehensive report generated successfully')
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
      change: '+12.5%',
      trend: 'up',
      period: 'from last month',
      icon: FileText,
      gradient: 'from-orange-500 to-amber-500',
      iconBg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Total Parts',
      value: stats.parts.toLocaleString(),
      change: '+8.2%',
      trend: 'up',
      period: 'from last month',
      icon: Activity,
      gradient: 'from-teal-500 to-cyan-500',
      iconBg: 'bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      change: '+4.3%',
      trend: 'up',
      period: 'from last month',
      icon: Users,
      gradient: 'from-violet-500 to-purple-500',
      iconBg: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Materials',
      value: stats.materials.toLocaleString(),
      change: '+15.8%',
      trend: 'up',
      period: 'from last month',
      icon: AlertCircle,
      gradient: 'from-blue-500 to-indigo-500',
      iconBg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  ]

  return (
    <Main className="p-4 md:p-6 lg:p-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 mb-6 shadow-2xl">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight animate-in fade-in slide-in-from-left-2 duration-500">
              Dashboard
            </h1>
            <p className="text-primary-foreground/90 text-sm sm:text-base animate-in fade-in slide-in-from-left-2 duration-500 delay-100">
              Welcome back, <span className="font-semibold text-white">{user?.firstName} {user?.lastName}</span>
            </p>
          </div>
          <Button 
            onClick={downloadReport} 
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 animate-in fade-in slide-in-from-right-2 duration-500"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      <Tabs
        orientation="vertical"
        defaultValue="overview"
        className="space-y-6"
      >
        <div className="w-full overflow-x-auto pb-2">
          <TabsList className="bg-gradient-to-r from-muted/80 to-muted/50 border-2 shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Stat Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {statCards.map((stat, index) => (
              <motion.div key={stat.title} variants={item}>
                <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 group cursor-pointer">
                  {/* Gradient Accent Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}></div>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                  
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-0">
                      <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        {stat.title}
                      </CardTitle>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.iconBg} shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <stat.icon className={`h-5 w-5 ${stat.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                        stat.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                        stat.trend === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400'
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

          {/* Enhanced Chart Card */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-8 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>
              <CardHeader className="bg-gradient-to-br from-muted/30 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Ticket Generation Overview</CardTitle>
                    <CardDescription className="mt-1">
                      Monthly breakdown of generated tickets vs failed attempts.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="ps-2 pt-6">
                <Overview stats={ticketsByDate} />
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Bottom Cards */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-1 lg:col-span-4 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-500"></div>
              <CardHeader className="bg-gradient-to-br from-violet-50/50 to-transparent dark:from-violet-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-950/30">
                    <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">User Leaderboard</CardTitle>
                    <CardDescription className="mt-1">
                      Top performers by ticket generation score.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <RecentSales users={users} leaderboardData={leaderboardData} />
              </CardContent>
            </Card>
            <Card className="col-span-1 lg:col-span-3 shadow-xl hover:shadow-2xl transition-all duration-300 border-2 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <CardHeader className="bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/30">
                    <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
                    <CardDescription className="mt-1">
                      Latest system events and user actions.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <RecentActivity activities={recentActivity} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Analytics />
        </TabsContent>
      </Tabs>
    </Main>
  )
}
