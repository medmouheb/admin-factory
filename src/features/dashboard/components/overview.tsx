import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'

interface OverviewProps {
  users: any[]
}

export default function Overview({ users }: OverviewProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentYear = new Date().getFullYear()
    
    const monthlyStats = months.map(name => ({
      name,
      tickets: 0,
      errors: 0
    }))

    users.forEach(user => {
      const date = new Date(user.updatedAt)
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth()
        monthlyStats[monthIndex].tickets++
        // Mock errors roughly 5% of tickets
        if (Math.random() > 0.95) monthlyStats[monthIndex].errors++
      }
    })

    setData(monthlyStats)
  }, [users])

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
