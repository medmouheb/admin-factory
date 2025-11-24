import { useAuthStore } from '@/stores/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Profile() {
    const { auth } = useAuthStore()
    const user = auth.user

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1">
                    <CardHeader className="flex flex-col items-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                            <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{user?.username || 'User'}</CardTitle>
                        <CardDescription>{user?.email || 'user@example.com'}</CardDescription>
                        <div className="mt-2 flex gap-2">
                            {user?.role?.map(r => (
                                <Badge key={r} variant="secondary">{r}</Badge>
                            ))}
                        </div>
                    </CardHeader>
                </Card>

                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" defaultValue={user?.username} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" defaultValue={user?.email} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="accountNo">Account No</Label>
                                <Input id="accountNo" defaultValue={user?.accountNo} disabled />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button>Save Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
