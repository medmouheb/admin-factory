import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, AlertCircle, UserPlus, FileText, Settings } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'ticket',
    user: 'Ahmed Ben Ali',
    action: 'generated 50 tickets',
    time: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    status: 'success'
  },
  {
    id: 2,
    type: 'alert',
    user: 'System',
    action: 'Printer B reported low ink',
    time: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    status: 'warning'
  },
  {
    id: 3,
    type: 'user',
    user: 'Sarah Connor',
    action: 'joined the platform',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'info'
  },
  {
    id: 4,
    type: 'ticket',
    user: 'Karim Tounsi',
    action: 'generated 120 tickets',
    time: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    status: 'success'
  },
  {
    id: 5,
    type: 'error',
    user: 'System',
    action: 'Failed to sync with ERP',
    time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    status: 'error'
  },
]

export function RecentActivity() {
  const getIcon = (type: string, status: string) => {
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />
    if (status === 'warning') return <AlertCircle className="h-4 w-4 text-amber-500" />
    
    switch (type) {
      case 'ticket': return <FileText className="h-4 w-4 text-blue-500" />
      case 'user': return <UserPlus className="h-4 w-4 text-green-500" />
      case 'settings': return <Settings className="h-4 w-4 text-gray-500" />
      default: return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-6">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative pl-6 pb-2 last:pb-0">
            {/* Timeline line */}
            {index !== activities.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border" />
            )}
            
            {/* Dot */}
            <div className="absolute left-0 top-1 h-6 w-6 rounded-full border bg-background flex items-center justify-center z-10">
              {getIcon(activity.type, activity.status)}
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">
                <span className="font-semibold">{activity.user}</span> {activity.action}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(activity.time, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
