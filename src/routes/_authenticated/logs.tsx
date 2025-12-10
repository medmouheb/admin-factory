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
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, RefreshCw, Loader2, Eye, Filter, X, FileText, Activity, ShieldAlert, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()
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
      <div className="min-h-screen bg-background/30 p-6 space-y-6">
        {/* Animated Gradient Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 p-8 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
              >
                <History className="h-10 w-10 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold text-white mb-2"
                >
                  System Logs
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-lg"
                >
                  {t('logs.subtitle')}
                </motion.p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={fetchLogs}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-md bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg font-bold text-foreground">{t('logs.filterLogs')}</CardTitle>
              </div>
              <Button variant="ghost" onClick={clearFilters} size="sm" className="h-8 text-muted-foreground hover:text-foreground hover:bg-purple-50">
                <X className="mr-2 h-3 w-3" /> {t('logs.resetFilters')}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{t('logs.username')}</span>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('logs.filterByUser')}
                      className="pl-9 bg-white"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{t('logs.model')}</span>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={t('logs.selectModel')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('logs.allModels')}</SelectItem>
                      <SelectItem value="Ticket">Ticket</SelectItem>
                      <SelectItem value="TicketCode">TicketCode</SelectItem>
                      <SelectItem value="Part">Part</SelectItem>
                      <SelectItem value="Material">Material</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{t('logs.startDate')}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>{t('logs.pickDate')}</span>}
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
                  <span className="text-xs font-semibold uppercase text-muted-foreground">{t('logs.endDate')}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>{t('logs.pickDate')}</span>}
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
              <div className="flex justify-end mt-4 pt-4 border-t">
                <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all">
                  <Filter className="mr-2 h-4 w-4" /> {t('logs.applyFilters')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-lg border-0 overflow-hidden">
            <div className="rounded-md border-0 bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-purple-50/50">
                  <TableRow>
                    <TableHead className="w-[180px] font-bold text-purple-900">{t('logs.timestamp')}</TableHead>
                    <TableHead className="w-[150px] font-bold text-purple-900">{t('logs.user')}</TableHead>
                    <TableHead className="w-[120px] font-bold text-purple-900">{t('logs.model')}</TableHead>
                    <TableHead className="w-[120px] font-bold text-purple-900">{t('logs.action')}</TableHead>
                    <TableHead className="font-bold text-purple-900">{t('logs.changesSummary')}</TableHead>
                    <TableHead className="w-[80px] text-right font-bold text-purple-900">{t('logs.details')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center">
                        <div className="flex flex-col justify-center items-center gap-3 text-muted-foreground">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                          <p>{t('logs.loadingLogs')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <div className="p-3 bg-muted rounded-full">
                            <Search className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p>{t('logs.noLogsFound')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((log, index) => (
                      <TableRow
                        key={log.id}
                        className="hover:bg-purple-50/30 transition-colors cursor-default"
                      >
                        <TableCell className="text-sm whitespace-nowrap font-medium text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                              {String(log.matricule).charAt(0)}
                            </div>
                            {log.matricule}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                            {log.model}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors shadow-sm",
                            // Custom styling for actions
                            log.action === 'CREATE' && "bg-green-100 text-green-700 border border-green-200",
                            log.action === 'UPDATE' && "bg-blue-100 text-blue-700 border border-blue-200",
                            log.action === 'DELETE' && "bg-red-100 text-red-700 border border-red-200",
                            !['CREATE', 'UPDATE', 'DELETE'].includes(log.action) && "bg-gray-100 text-gray-700"
                          )}>
                            {log.action}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[400px] truncate text-muted-foreground text-sm font-mono">
                          {log.action === 'UPDATE' && (
                            <span>{t('logs.modifiedID')}: <span className="text-foreground font-semibold">{log.currentData?.id || log.previousData?.id}</span></span>
                          )}
                          {log.action === 'CREATE' && (
                            <span>{t('logs.createdID')}: <span className="text-foreground font-semibold">{log.currentData?.id}</span></span>
                          )}
                          {log.action === 'DELETE' && (
                            <span>{t('logs.deletedID')}: <span className="text-foreground font-semibold">{log.previousData?.id}</span></span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="hover:bg-purple-100 hover:text-purple-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{t('logs.viewDetails')}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between p-4 border-t bg-gray-50/50">
              <div className="text-sm text-muted-foreground">
                {t('common.showing')} <span className="font-medium text-foreground">{totalItems > 0 ? ((page - 1) * 20) + 1 : 0}</span> {t('logs.to')} <span className="font-medium text-foreground">{Math.min(page * 20, totalItems)}</span> {t('common.of')} <span className="font-medium text-foreground">{totalItems}</span> {t('common.entries')}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="bg-white shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('common.previous')}
                </Button>
                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm font-medium">{t('common.page')} {page} {t('common.of')} {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="bg-white shadow-sm"
                >
                  {t('common.next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto flex flex-col gap-0 p-0 rounded-2xl">
            <DialogHeader className="p-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-purple-900">
                <Activity className="h-5 w-5 text-purple-600" />
                {t('logs.logDetails')}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {selectedLog && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold shadow-sm",
                        selectedLog.action === 'CREATE' && "bg-green-100 text-green-700 border border-green-200",
                        selectedLog.action === 'UPDATE' && "bg-blue-100 text-blue-700 border border-blue-200",
                        selectedLog.action === 'DELETE' && "bg-red-100 text-red-700 border border-red-200",
                      )}>
                        {selectedLog.action}
                      </span>
                      <span className="text-muted-foreground text-sm">{t('logs.on')}</span>
                      <span className="font-semibold text-sm bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{selectedLog.model}</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span>{t('logs.performedBy')}</span>
                      <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border">
                        <span className="font-bold text-foreground">{selectedLog.matricule}</span>
                      </div>
                      <span>{t('logs.at')} {new Date(selectedLog.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 bg-white/50 backdrop-blur-sm">
              {selectedLog && <LogDetailsViewer log={selectedLog} t={t} />}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Main>
  )
}

function LogDetailsViewer({ log, t }: { log: Log; t: any }) {
  const parseData = (data: any) => {
    if (!data) return {}
    try {
      if (typeof data === 'string') {
        const parsed = JSON.parse(data)
        // Handle double encoded json if necessary, but usually once is enough
        return typeof parsed === 'string' ? JSON.parse(parsed) : parsed
      }
      return data
    } catch (e) {
      console.error("Failed to parse log data", e)
      return data // Return as is if parse fails
    }
  }

  const oldData = parseData(log.previousData)
  const newData = parseData(log.currentData)

  // Include password in keys but handle it specially
  const allKeys = Array.from(new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {})
  ])).filter(key => key !== '__v') // exclude only internal keys

  // Field icon mapping
  const getFieldIcon = (fieldName: string) => {
    const iconMap: Record<string, string> = {
      id: '🔑',
      firstName: '👤',
      lastName: '👤',
      matricule: '🎫',
      email: '📧',
      phone: '📱',
      role: '👔',
      status: '📊',
      createdAt: '📅',
      updatedAt: '🔄',
      password: '🔐',
      learPN: '🔢',
      tescaPN: '🔢',
      desc: '📝',
      description: '📝',
      qtyPerBox: '📦',
      quantity: '📦',
      location: '📍',
      target: '🎯',
      barcode: '📊',
      barcode1: '📊',
      barcode2: '📊',
    }
    return iconMap[fieldName] || '📌'
  }

  if (log.action === 'UPDATE') {
    // Check if password was changed
    const passwordChanged = oldData?.password !== newData?.password && (oldData?.password || newData?.password)

    return (
      <div className="space-y-4">
        {passwordChanged && (
          <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center gap-3 animate-pulse">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                Password Changed
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t('logs.securityUpdated')}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px]">{t('logs.field')}</TableHead>
                <TableHead className="text-red-600 w-[40%]">{t('logs.previousValue')}</TableHead>
                <TableHead className="text-green-600 w-[40%]">{t('logs.newValue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allKeys.map(key => {
                const oldVal = oldData?.[key]
                const newVal = newData?.[key]
                const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal)

                if (!isChanged && (key === 'updatedAt' || key === 'createdAt')) return null

                // Special handling for password
                if (key === 'password') {
                  if (!isChanged) return null
                  return (
                    <TableRow key={key} className="bg-amber-50 dark:bg-amber-950/10 border-l-4 border-l-amber-500">
                      <TableCell className="font-semibold text-amber-900 dark:text-amber-100">
                        <span className="mr-2">{getFieldIcon(key)}</span>
                        Password
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {oldVal ? '••••••••' : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-amber-700 dark:text-amber-300">
                        {newVal ? '••••••••' : '-'}
                      </TableCell>
                    </TableRow>
                  )
                }

                return (
                  <TableRow key={key} className={isChanged ? 'bg-muted/30' : ''}>
                    <TableCell className="font-medium text-muted-foreground">
                      <span className="mr-2">{getFieldIcon(key)}</span>
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </TableCell>
                    <TableCell className="break-all font-mono text-sm text-muted-foreground">
                      {oldVal !== undefined ? (typeof oldVal === 'object' ? JSON.stringify(oldVal) : String(oldVal)) : '-'}
                    </TableCell>
                    <TableCell className={cn("break-all font-mono text-sm", isChanged ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {newVal !== undefined ? (typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal)) : '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
              {allKeys.length === 0 && <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">{t('logs.noDetailsAvailable')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // CREATE or DELETE -> Single view
  const targetData = log.action === 'CREATE' ? newData : oldData
  const colorClass = log.action === 'CREATE' ? "text-green-600" : "text-red-600"

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">{t('logs.field')}</TableHead>
            <TableHead className={colorClass + " w-full"}>{t('logs.value')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allKeys.map(key => {
            const val = targetData?.[key]

            // Special handling for password display
            if (key === 'password') {
              return (
                <TableRow key={key} className="bg-muted/20">
                  <TableCell className="font-medium text-muted-foreground">
                    <span className="mr-2">{getFieldIcon(key)}</span>
                    <span className="capitalize">Password</span>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {val ? '••••••••' : '-'}
                  </TableCell>
                </TableRow>
              )
            }

            return (
              <TableRow key={key}>
                <TableCell className="font-medium text-muted-foreground">
                  <span className="mr-2">{getFieldIcon(key)}</span>
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </TableCell>
                <TableCell className="break-all font-mono text-sm">
                  {val !== undefined ? (typeof val === 'object' ? JSON.stringify(val) : String(val)) : '-'}
                </TableCell>
              </TableRow>
            )
          })}
          {allKeys.length === 0 && <TableRow><TableCell colSpan={2} className="text-center h-24 text-muted-foreground">{t('logs.noDetailsAvailable')}</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  )
}
