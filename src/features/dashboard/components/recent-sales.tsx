import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trophy, Medal, Award } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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
}

export function RecentSales({ users }: RecentSalesProps) {
  const [displayUsers, setDisplayUsers] = useState<UserStats[]>([])
  const [maxScore, setMaxScore] = useState(0)

  useEffect(() => {
    if (!users.length) return

    // Mocking stats since they are not in DB yet
    const usersWithStats = users.map((user: User) => {
      const tickets = Math.floor(Math.random() * 450) + 50
      const score = Math.floor(tickets * 1.5 + Math.random() * 100)
      return {
        ...user,
        tickets,
        score
      }
    })

    // Sort by score desc
    const sortedUsers = usersWithStats.sort((a: UserStats, b: UserStats) => b.score - a.score)
    
    if (sortedUsers.length > 0) {
      setMaxScore(sortedUsers[0].score)
    }

    setDisplayUsers(sortedUsers.slice(0, 10))
  }, [users])

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
                      Top {index + 1}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                   <span className="font-bold text-sm">{user.score}</span>
                   <span className="text-xs text-muted-foreground ml-1">pts</span>
                </div>
              </div>
              
              <div className="w-full flex items-center gap-3">
                <Progress value={scorePercentage} className="h-1.5 flex-1" />
                <p className='text-xs text-muted-foreground w-24 text-right truncate'>
                  {user.tickets} Tickets
                </p>
              </div>
            </div>
          </div>
        )
      })}
      {displayUsers.length === 0 && (
         <div className="text-sm text-muted-foreground text-center py-8">No users found.</div>
      )}
    </div>
  )
}

export default RecentSales
