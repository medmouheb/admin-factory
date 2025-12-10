import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, AlertCircle, UserPlus, FileText, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ActivityItem {
  id: number
  ticketCode?: string
  barcode?: string
  createdAt: string
  updatedAt: string
}

interface RecentActivityProps {
  activities?: ActivityItem[]
}

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  const { t } = useTranslation()
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
              {getIcon('ticket', 'success')}
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">
                <span className="font-semibold">{activity.ticketCode}</span> {t('recentActivity.generated')}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">{t('recentActivity.noRecentActivity')}</p>}
      </div>
    </ScrollArea>
  )
}
