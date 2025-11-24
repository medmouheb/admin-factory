import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Workspace() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Workspace</h2>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder Projects */}
                {[1, 2, 3, 4, 5].map((i) => (
                    <Card key={i} className="hover:bg-muted/50 cursor-pointer transition-colors">
                        <CardHeader>
                            <CardTitle>Project {i}</CardTitle>
                            <CardDescription>Last updated 2 hours ago</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                This is a description for project {i}. It contains various tasks and resources.
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
