import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'
import { useEffect, useState } from 'react'
import { isWithinInterval, startOfDay, endOfDay, getHours } from 'date-fns'
import { DateRange } from 'react-day-picker'

interface ShiftChartProps {
  users: any[]
  dateRange?: DateRange
}

export default function ShiftChart({ users, dateRange }: ShiftChartProps) {
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

    // Initialize shifts
    const shifts = [
      { name: 'Morning (6-14)', tickets: 0, color: '#0ea5e9' },
      { name: 'Afternoon (14-22)', tickets: 0, color: '#f59e0b' },
      { name: 'Night (22-6)', tickets: 0, color: '#8b5cf6' },
    ]

    filteredUsers.forEach(user => {
      const date = new Date(user.updatedAt)
      const hour = getHours(date)

      if (hour >= 6 && hour < 14) {
        shifts[0].tickets++
      } else if (hour >= 14 && hour < 22) {
        shifts[1].tickets++
      } else {
        shifts[2].tickets++
      }
    })

    setData(shifts)

  }, [users, dateRange])

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={120} 
          tick={{ fontSize: 12, fill: '#6b7280' }} 
          axisLine={false} 
          tickLine={false} 
        />
        <Tooltip 
          cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          contentStyle={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(4px)',
            borderRadius: '12px', 
            border: '1px solid rgba(0,0,0,0.1)', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}
        />
        <Bar dataKey="tickets" radius={[0, 4, 4, 0]} barSize={32} animationDuration={1500}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
