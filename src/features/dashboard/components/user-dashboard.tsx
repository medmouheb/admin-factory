import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { History, Package, Truck, CheckCircle, RotateCcw } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

interface HistoryEntry {
    action: string
    user: string
    date: string
    details?: string
    packetId: string
}

export function UserDashboard() {
    const { auth } = useAuthStore()
    const [activities, setActivities] = useState<HistoryEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivity = async () => {
            if (!auth.user) return
            try {
                const res = await fetch('http://localhost:8080/api/packets', { credentials: 'include' })
                if (res.ok) {
                    const packets = await res.json()
                    const userActivity: HistoryEntry[] = []

                    packets.forEach((packet: any) => {
                        // Check if user created the packet
                        const isCreator = packet.userId === auth.user?.matricule ||
                            (packet.userMatricule && packet.userMatricule === auth.user?.matricule);

                        if (isCreator) {
                            userActivity.push({
                                action: 'Packet Created',
                                user: packet.userId || auth.user?.matricule || 'Unknown',
                                date: packet.createdAt || packet.date, // Use createdAt if available, else date
                                details: `Created packet ${packet.id} with ${packet.quantity} items`,
                                packetId: packet.id
                            })
                        }

                        if (packet.history && Array.isArray(packet.history)) {
                            packet.history.forEach((h: any) => {
                                // Filter by username or matricule if available
                                if (h.user === auth.user?.matricule || h.user === auth.user?.matricule) {
                                    // Avoid duplicate if history already has "Creation" and we just added it
                                    if (isCreator && h.action === 'Packet Created') return;

                                    userActivity.push({
                                        ...h,
                                        packetId: packet.id
                                    })
                                }
                            })
                        }
                    })

                    // Sort by date descending
                    userActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    setActivities(userActivity)
                }
            } catch {
                toast.error('Failed to fetch activity')
            } finally {
                setLoading(false)
            }
        }

        fetchActivity()
    }, [auth.user])

    const getIcon = (action: string) => {
        if (action.includes('Transfer')) return <Truck className="h-4 w-4 text-blue-500" />
        if (action.includes('Receive')) return <CheckCircle className="h-4 w-4 text-green-500" />
        if (action.includes('Return')) return <RotateCcw className="h-4 w-4 text-orange-500" />
        return <Package className="h-4 w-4 text-gray-500" />
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src="/avatars/shadcn.jpg" alt={auth.user?.firstName} />
                        <AvatarFallback>{auth.user?.firstName?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {auth.user?.firstName || 'User'}!</h2>
                        <p className="text-muted-foreground">Here's what's happening with your tasks today.</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activities.length}</div>
                        <p className="text-muted-foreground text-xs">
                            Recorded activities
                        </p>
                    </CardContent>
                </Card>
                {/* Other stats can be real or placeholders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-muted-foreground text-xs">
                            Requires attention
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98%</div>
                        <p className="text-muted-foreground text-xs">
                            +2% from last week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>My Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            {loading ? (
                                <div className="text-center py-4">Loading activity...</div>
                            ) : activities.length > 0 ? (
                                <div className="space-y-4">
                                    {activities.map((activity, index) => (
                                        <div key={index} className="flex items-start gap-4 border-b pb-3 last:border-0">
                                            <div className="mt-1 bg-muted p-2 rounded-full">
                                                {getIcon(activity.action)}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {activity.action} - Packet {activity.packetId}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {activity.details || 'No details available'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity.date).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-center py-4">No recent activity found.</p>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button className="w-full">Create New Packet</Button>
                        <Button className="w-full" variant="outline">View Schedule</Button>
                        <Button className="w-full" variant="secondary">Report Issue</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
