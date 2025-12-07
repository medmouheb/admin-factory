import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { useEffect, useState } from 'react'
import { format, getWeek } from 'date-fns'

interface AnalyticsChartProps {
  stats: { date: string; count: number; errors?: number }[]
  granularity: 'day' | 'week' | 'month'
}

export default function AnalyticsChart({ stats, granularity }: AnalyticsChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    if (!stats) {
      setData([])
      return
    }

    const chartData = stats.map(item => {
      const date = new Date(item.date)
      let name = ''

      if (granularity === 'day') {
        name = format(date, 'MMM dd')
      } else if (granularity === 'week') {
        name = `Week ${getWeek(date)}`
      } else if (granularity === 'month') {
        name = format(date, 'MMM yyyy')
      }

      return {
        name,
        tickets: item.count || 0,
        errors: item.errors || 0, // Cast to any or update interface if necessary
        originalDate: date.getTime()
      }
    }).sort((a, b) => a.originalDate - b.originalDate)

    setData(chartData)
  }, [stats, granularity])

  return (
    <ResponsiveContainer width='100%' height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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


