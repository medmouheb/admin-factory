import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface OverviewProps {
  stats: { date: string; count: number }[]
}

export default function Overview({ stats = [] }: OverviewProps) {
  const { t } = useTranslation()
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const months = [
      t('overview.jan'), t('overview.feb'), t('overview.mar'),
      t('overview.apr'), t('overview.may'), t('overview.jun'),
      t('overview.jul'), t('overview.aug'), t('overview.sep'),
      t('overview.oct'), t('overview.nov'), t('overview.dec')
    ]
    const currentYear = new Date().getFullYear()

    const monthlyStats = months.map(name => ({
      name,
      tickets: 0,
      validated: 0,
      errors: 0
    }))

    if (stats && stats.length > 0) {
      stats.forEach(item => {
        const date = new Date(item.date)
        if (date.getFullYear() === currentYear) {
          const monthIndex = date.getMonth()
          const totalCount = item.count || 0
          
          monthlyStats[monthIndex].tickets += totalCount
          // Detail: mock validation logic since backend doesn't split it yet
          const mockedErrors = Math.floor(totalCount * 0.02)
          monthlyStats[monthIndex].errors += mockedErrors
          monthlyStats[monthIndex].validated += (totalCount - mockedErrors)
        }
      })
    }
    
    setData(monthlyStats)
  }, [stats, t])

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
        </div>
      )
    }
    return null
  }

  // Calculate max value for gradient effect
  const maxValue = Math.max(...data.map(d => d.tickets), 1)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="ticketsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="validatedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id="errorsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
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
          name={t('overview.ticketsGenerated') || "Tickets Générés"}
          fill="url(#ticketsGradient)"
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-tickets-${index}`}
              opacity={0.7 + (entry.tickets / maxValue) * 0.3}
            />
          ))}
        </Bar>
        <Bar
          dataKey="validated"
          name={"Tickets Validés"}
          fill="url(#validatedGradient)"
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
          animationBegin={200}
        />
        <Bar
          dataKey="errors"
          name={t('overview.failedAttempts') || "Erreurs"}
          fill="url(#errorsGradient)"
          radius={[4, 4, 0, 0]}
          animationDuration={1000}
          animationBegin={400}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
