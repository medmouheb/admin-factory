import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'
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

  // Custom tooltip with beautiful styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border-2 border-primary/20 rounded-xl p-4 shadow-2xl">
          <p className="font-bold text-lg mb-2 text-foreground">{label}</p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-sm font-medium text-muted-foreground">{entry.name}:</span>
                </div>
                <span className="text-sm font-bold" style={{ color: entry.color }}>{entry.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total:</span>
              <span className="text-sm font-bold text-foreground">
                {payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate max value for gradient effect
  const maxValue = Math.max(...data.map(d => d.tickets))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="ticketsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
          </linearGradient>
          <linearGradient id="errorsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.1)' }} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
          formatter={(value) => <span className="text-sm font-medium text-foreground">{value}</span>}
        />
        <Bar
          dataKey="tickets"
          name="Tickets Generated"
          fill="url(#ticketsGradient)"
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
          animationBegin={0}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              opacity={entry.tickets > 0 ? 0.8 + (entry.tickets / maxValue) * 0.2 : 0.3}
            />
          ))}
        </Bar>
        <Bar
          dataKey="errors"
          name="Failed Attempts"
          fill="url(#errorsGradient)"
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
          animationBegin={200}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
