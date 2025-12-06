import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Main } from '@/components/layout/main'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, RefreshCw, Loader2, Eye, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import axios from 'axios'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

export const Route = createFileRoute('/_authenticated/logs')({
  component: LogsPage,
})

interface Log {
  id: number
  matricule: number
  model: string
  action: string
  previousData: any
  currentData: any
  timestamp: string
  createdAt: string
  updatedAt: string
}

function LogsPage() {
  const [data, setData] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filters
  const [username, setUsername] = useState('')
  const [model, setModel] = useState('all')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()

  // Detail Dialog
  const [selectedLog, setSelectedLog] = useState<Log | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        limit: 20,
      }

      if (username) params.username = username
      if (model && model !== 'all') params.model = model
      if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd')
      if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd')

      const response = await axios.get('http://localhost:8080/api/logs', { params, withCredentials: true })

      const { data: logs, totalPages: total, totalItems: items } = response.data
      setData(logs)
      setTotalPages(total)
      setTotalItems(items)
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  // Trigger fetch when page or dates/model change. username waits for manual trigger or enter.
  useEffect(() => {
    fetchLogs()
  }, [page, model, endDate, startDate])

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const clearFilters = () => {
    setUsername('')
    setModel('all')
    setStartDate(undefined)
    setEndDate(undefined)
    setPage(1)
    // The useEffects will trigger refresh when these change (except username which is not in dependency array for auto-fetch to avoid typing lag, but model/dates rely on deps)
    // Actually, since I added startDate/endDate/model to deps, clearing them will trigger fetch.
    // Username needs manual kick if it was set, but just clearing state won't trigger if it's not in deps.
    // Let's force a fetch for completeness.
    setTimeout(fetchLogs, 0)
  }

  return (
    <Main>
      <div className='flex flex-col space-y-6 p-4 md:p-8 pt-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>System Logs</h1>
            <p className='text-muted-foreground mt-2'>
              Audit trail of system activities and data changes.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant="outline" onClick={fetchLogs} title="Refresh">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-4 bg-background p-4 rounded-lg border shadow-sm lg:flex-row lg:items-end'>
          <div className="grid gap-4 flex-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by user..."
                  className="pl-9"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Model</span>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="Ticket">Ticket</SelectItem>
                  <SelectItem value="TicketCode">TicketCode</SelectItem>
                  <SelectItem value="Part">Part</SelectItem>
                  <SelectItem value="Material">Material</SelectItem>
                  <SelectItem value="User">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Start Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">End Date</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2 min-w-[140px]">
            <Button onClick={handleSearch} className="flex-1">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="ghost" onClick={clearFilters} size="icon" title="Clear Filters">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[150px]">User</TableHead>
                <TableHead className="w-[120px]">Model</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
                <TableHead>Changes Summary</TableHead>
                <TableHead className="w-[80px] text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading logs...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No logs found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm whitespace-nowrap font-medium text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{log.matricule}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        {log.model}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
                        // Custom styling for actions
                        log.action === 'CREATE' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                        log.action === 'UPDATE' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                        log.action === 'DELETE' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                        !['CREATE', 'UPDATE', 'DELETE'].includes(log.action) && "bg-gray-100 text-gray-700"
                      )}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate text-muted-foreground text-sm">
                      {log.action === 'UPDATE' && (
                        <span>Modified ID: {log.currentData?.id || log.previousData?.id}</span>
                      )}
                      {log.action === 'CREATE' && (
                        <span>Created ID: {log.currentData?.id}</span>
                      )}
                      {log.action === 'DELETE' && (
                        <span>Deleted ID: {log.previousData?.id}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="sr-only">View Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{totalItems}</span> entries (Page {page} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-screen overflow-y-auto flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ScrollArea className="h-5 w-5" />
                Log Details
              </DialogTitle>
              <DialogDescription className="text-base">
                {selectedLog && (
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedLog.action}</span>
                      <span className="text-muted-foreground">on</span>
                      <span className="font-semibold">{selectedLog.model}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      By <span className="font-medium text-foreground">{selectedLog.username}</span> at {new Date(selectedLog.timestamp).toLocaleString()}
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.previousData && (
                    <div className="flex flex-col gap-2">
                      <h4 className="font-semibold text-sm text-red-600 flex items-center gap-2">
                        Previous Data
                      </h4>
                      <div className="bg-muted/50 rounded-md border p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedLog.previousData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {selectedLog.currentData && (
                    <div className="flex flex-col gap-2">
                      <h4 className="font-semibold text-sm text-green-600 flex items-center gap-2">
                        Current Data
                      </h4>
                      <div className="bg-muted/50 rounded-md border p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {JSON.stringify(selectedLog.currentData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  {!selectedLog.previousData && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground italic text-sm border rounded-md bg-muted/10">
                      No Previous Data
                    </div>
                  )}
                  {!selectedLog.currentData && (
                    <div className="flex items-center justify-center p-8 text-muted-foreground italic text-sm border rounded-md bg-muted/10">
                      No Current Data
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Main>
  )
}
