import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  updatedAt: string
  role: string
}

interface UserStats extends User {
  tickets: number
  score: number
}

interface RecentSalesProps {
  users: any[]
  leaderboardData: { matricule: string; count: number }[]
}

export function RecentSales({ users, leaderboardData }: RecentSalesProps) {
  const { t } = useTranslation()
  const [displayUsers, setDisplayUsers] = useState<UserStats[]>([])
  const [maxScore, setMaxScore] = useState(0)

  useEffect(() => {
    if (!users.length && !leaderboardData.length) return

    // Map leaderboard data to users
    const usersWithStats = leaderboardData
      .map((entry) => {
        const user = users.find((u) => u.matricule === entry.matricule) || {
          id: entry.matricule,
          firstName: 'User',
          lastName: entry.matricule,
          email: '',
          updatedAt: new Date().toISOString(),
          role: 'unknown',
        }

        const tickets = entry.count
        const score = tickets * 10

        return {
          ...user,
          tickets,
          score
        }
      })
      .sort((a, b) => b.score - a.score)

    if (usersWithStats.length > 0) {
      setMaxScore(usersWithStats[0].score)
    }

    setDisplayUsers(usersWithStats.slice(0, 10))
  }, [users, leaderboardData])

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-muted-foreground font-medium w-5 text-center">{index + 1}</span>
    }
  }

  return (
    <div className='space-y-6'>
      {displayUsers.map((user, index) => {
        const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase()
        const scorePercentage = (user.score / maxScore) * 100

        return (
          <div key={user.id} className='flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group'>
            <div className="flex items-center justify-center w-8">
              {getRankIcon(index)}
            </div>

            <Avatar className={cn('h-10 w-10 border-2', index === 0 ? 'border-yellow-500' : index === 1 ? 'border-gray-400' : index === 2 ? 'border-amber-600' : 'border-transparent')}>
              <AvatarImage src={`/avatars/${(index % 5) + 1}.png`} alt='Avatar' />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className='flex flex-1 flex-col gap-1'>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className='text-sm font-semibold leading-none'>{user.firstName} {user.lastName}</p>
                  {index < 3 && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {t('recentSales.top')} {index + 1}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm">{user.score}</span>
                  <span className="text-xs text-muted-foreground ml-1">{t('recentSales.pts')}</span>
                </div>
              </div>

              <div className="w-full flex items-center gap-3">
                <Progress value={scorePercentage} className="h-1.5 flex-1" />
                <p className='text-xs text-muted-foreground w-24 text-right truncate'>
                  {user.tickets} {t('recentSales.tickets')}
                </p>
              </div>
            </div>
          </div>
        )
      })}
      {displayUsers.length === 0 && (
        <div className="text-sm text-muted-foreground text-center py-8">{t('recentSales.noUsersFound')}</div>
      )}
    </div>
  )
}

export default RecentSales
