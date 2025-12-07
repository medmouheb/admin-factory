import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'

interface OverviewProps {
  stats: { date: string; count: number }[]
}

export default function Overview({ stats = [] }: OverviewProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()

    const monthlyStats = months.map(name => ({
      name,
      tickets: 0,
      errors: 0
    }))

    stats.forEach(item => {
      const date = new Date(item.date)
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth()
        monthlyStats[monthIndex].tickets += item.count
        // Mock errors roughly 2% of tickets (since API doesn't give errors yet)
        monthlyStats[monthIndex].errors += Math.floor(item.count * 0.02)
      }
    })

    setData(monthlyStats)
  }, [stats])

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Legend />
        <Bar
          dataKey='tickets'
          name="Tickets Generated"
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
        <Bar
          dataKey='errors'
          name="Failed Attempts"
          fill='#ef4444'
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
