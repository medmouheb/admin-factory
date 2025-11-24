import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, User } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

interface Mission {
    id: string
    title: string
    status: 'pending' | 'in-progress' | 'completed'
    date: string
    description: string
}

export function OperatorDashboard() {
    const { auth } = useAuthStore()
    const navigate = useNavigate()
    const [missions, setMissions] = useState<Mission[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchMissions() {
            if (!auth.user?.matricule) {
                setIsLoading(false)
                return
            }

            try {
                // Replace with actual API call using auth.user.matricule
                // const res = await fetch(`http://localhost:8080/api/missions/${auth.user.matricule}`)
                // const data = await res.json()

                // Mock data for now
                await new Promise(resolve => setTimeout(resolve, 1000))
                setMissions([
                    {
                        id: '1',
                        title: 'Inspect Packet #1234',
                        status: 'completed',
                        date: '2023-10-25',
                        description: 'Quality check for batch A.'
                    },
                    {
                        id: '2',
                        title: 'Retouch Packet #5678',
                        status: 'in-progress',
                        date: '2023-10-26',
                        description: 'Fix stitching errors.'
                    },
                    {
                        id: '3',
                        title: 'Verify Export #9012',
                        status: 'pending',
                        date: '2023-10-27',
                        description: 'Final verification before shipping.'
                    }
                ])
            } catch (error) {
                toast.error('Failed to load missions')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMissions()
    }, [auth.user?.matricule])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Operator Dashboard</h2>
                <Button variant="outline" onClick={() => navigate({ to: '/profile' })}>
                    <User className="mr-2 h-4 w-4" /> Profile
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Mission History</CardTitle>
                        <CardDescription>
                            History of missions for matricule: {auth.user?.matricule || 'N/A'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-4">
                                    {missions.map((mission) => (
                                        <div key={mission.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">{mission.title}</p>
                                                <p className="text-sm text-muted-foreground">{mission.description}</p>
                                                <p className="text-xs text-muted-foreground">{mission.date}</p>
                                            </div>
                                            <Badge variant={
                                                mission.status === 'completed' ? 'default' :
                                                    mission.status === 'in-progress' ? 'secondary' : 'outline'
                                            }>
                                                {mission.status}
                                            </Badge>
                                        </div>
                                    ))}
                                    {missions.length === 0 && (
                                        <p className="text-center text-muted-foreground">No missions found.</p>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Completed</span>
                            <span className="text-2xl font-bold">{missions.filter(m => m.status === 'completed').length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Pending</span>
                            <span className="text-2xl font-bold">{missions.filter(m => m.status === 'pending').length}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
