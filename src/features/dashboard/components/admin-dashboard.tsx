import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Overview } from './overview'
import { RecentSales } from './recent-sales'
import { Button } from '@/components/ui/button'
import { CalendarDateRangePicker } from './date-range-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Activity, Users, Info, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DashboardStats {
    counts: {
        tickets: { total: number; growth: number }
        pieces: { total: number; growth: number }
        users: { total: number; growth: number }
        materials: { total: number; growth: number }
    }
    recentActivity: any[]
}

export function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                // Determine token source (cookie or localStorage) - simpler to let browser handle cookies if 'include'
                const res = await fetch('http://localhost:8080/api/stats/dashboard', {
                    credentials: 'include'
                })
                if (!res.ok) throw new Error('Failed to fetch stats')
                const data = await res.json()
                setStats(data)
            } catch (error) {
                console.error(error)
                toast.error('Failed to load dashboard stats')
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
                <div className="flex items-center space-x-2">
                    <CalendarDateRangePicker />
                    <Button>Télécharger</Button>
                </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="analytics" disabled>
                        Analytique
                    </TabsTrigger>
                    <TabsTrigger value="reports" disabled>
                        Rapports
                    </TabsTrigger>
                    <TabsTrigger value="notifications" disabled>
                        Notifications
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                    TOTAL DES TICKETS
                                </CardTitle>
                                <div className="p-2 bg-orange-100 rounded-full">
                                    <FileText className="h-4 w-4 text-orange-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.counts.tickets.total || 0}</div>
                                <p className="text-xs font-medium text-emerald-600 bg-emerald-100 inline-block px-2 py-0.5 rounded-full mt-1">
                                    +{stats?.counts.tickets.growth}% du mois dernier
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                    TOTAL DES PIÈCES
                                </CardTitle>
                                <div className="p-2 bg-emerald-100 rounded-full">
                                    <Activity className="h-4 w-4 text-emerald-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.counts.pieces.total || 0}</div>
                                <p className="text-xs font-medium text-emerald-600 bg-emerald-100 inline-block px-2 py-0.5 rounded-full mt-1">
                                    +{stats?.counts.pieces.growth}% du mois dernier
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                    UTILISATEURS ACTIFS
                                </CardTitle>
                                <div className="p-2 bg-purple-100 rounded-full">
                                    <Users className="h-4 w-4 text-purple-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.counts.users.total || 0}</div>
                                <p className="text-xs font-medium text-emerald-600 bg-emerald-100 inline-block px-2 py-0.5 rounded-full mt-1">
                                    +{stats?.counts.users.growth}% du mois dernier
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                    MATÉRIAUX
                                </CardTitle>
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Info className="h-4 w-4 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.counts.materials.total || 0}</div>
                                <p className="text-xs font-medium text-emerald-600 bg-emerald-100 inline-block px-2 py-0.5 rounded-full mt-1">
                                    +{stats?.counts.materials.growth}% du mois dernier
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Vue d'ensemble</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <Overview />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Activité Récente</CardTitle>
                                <CardDescription>
                                    Journal d'activité récent.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <RecentSales />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
