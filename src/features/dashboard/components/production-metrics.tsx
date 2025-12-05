import { TrendingUp } from "lucide-react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ProductionMetrics() {
  const chartData = [
    { browser: "safari", visitors: 1260, fill: "var(--color-safari)" },
  ]
  
  // Mock data for the gauge
  const score = 78 // 78% efficiency
  const data = [
    {
      name: 'Efficiency',
      value: score,
      fill: '#22c55e',
    },
  ]

  const endAngle = 180 - (score / 100) * 180

  return (
    <div className="h-full">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative h-[200px] w-[200px]">
             <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                startAngle={90}
                endAngle={450} // Full circle
                innerRadius={80}
                outerRadius={110}
                barSize={15}
                data={[{ value: 100, fill: '#e5e7eb' }]} // Background ring
              >
                <PolarRadiusAxis tick={false} axisLine={false} />
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
               <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  startAngle={90}
                  endAngle={90 - (360 * score) / 100}
                  innerRadius={80}
                  outerRadius={110}
                  barSize={15}
                  data={data}
                >
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{score}%</span>
              <span className="text-sm text-muted-foreground">Efficiency</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
              <span className="text-2xl font-bold">1,240</span>
              <span className="text-xs text-muted-foreground">Daily Target</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
              <span className="text-2xl font-bold text-green-600">967</span>
              <span className="text-xs text-muted-foreground">Actual</span>
            </div>
          </div>
        </div>
    </div>
  )
}
