import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { useEffect, useState } from 'react'
import { format, isWithinInterval, startOfDay, endOfDay, getWeek, getYear, getMonth } from 'date-fns'
import { DateRange } from 'react-day-picker'

interface AnalyticsChartProps {
  users: any[]
  granularity: 'day' | 'week' | 'month'
  dateRange?: DateRange
}

export function AnalyticsChart({ users, granularity, dateRange }: AnalyticsChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    if (!users.length || !dateRange?.from) {
      setData([])
      return
    }

    const start = startOfDay(dateRange.from)
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)

    // Filter users within range
    const filteredUsers = users.filter(user => {
      const userDate = new Date(user.updatedAt)
      return isWithinInterval(userDate, { start, end })
    })

    // Grouping logic
    const groupedData: Record<string, { tickets: number, errors: number, sortKey: number }> = {}

    filteredUsers.forEach(user => {
      const date = new Date(user.updatedAt)
      let key = ''
      let sortKey = 0

      if (granularity === 'day') {
        key = format(date, 'MMM dd')
        sortKey = date.getTime()
      } else if (granularity === 'week') {
        key = `Week ${getWeek(date)}`
        sortKey = getWeek(date) + (getYear(date) * 100)
      } else if (granularity === 'month') {
        key = format(date, 'MMM yyyy')
        sortKey = getMonth(date) + (getYear(date) * 100)
      }

      if (!groupedData[key]) {
        groupedData[key] = { tickets: 0, errors: 0, sortKey }
      }
      groupedData[key].tickets++
    })

    // Convert to array and sort
    const chartData = Object.keys(groupedData)
      .map(key => ({
        name: key,
        tickets: groupedData[key].tickets,
        errors: groupedData[key].errors,
        sortKey: groupedData[key].sortKey
      }))
      .sort((a, b) => a.sortKey - b.sortKey)

    setData(chartData)

  }, [users, granularity, dateRange])

  return (
    <ResponsiveContainer width='100%' height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          dx={-10}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(4px)',
            borderRadius: '12px', 
            border: '1px solid rgba(0,0,0,0.1)', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}
          cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Area
          type='monotone'
          dataKey='tickets'
          name="Tickets Generated"
          stroke='#3b82f6'
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorTickets)"
          activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
          animationDuration={1500}
        />
        <Area
          type='monotone'
          dataKey='errors'
          name="Errors"
          stroke='#ef4444'
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorErrors)"
          activeDot={{ r: 6, strokeWidth: 0, fill: '#ef4444' }}
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default AnalyticsChart
