import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sunrise,
  Sun,
  Moon,
  Users,
  Package,
  Barcode,
  Calendar,
  RefreshCw,
  Search,
  FileSpreadsheet,
  TrendingUp,
  Award,
  Layers,
  ArrowUpDown
} from 'lucide-react'
import { toast } from 'sonner'

interface ShiftDetail {
  tickets: number
  huCount: number
  qty: number
}

interface OperatorProd {
  matricule: string
  operatorName: string
  role: string
  topShift: 'morning' | 'afternoon' | 'night'
  morning: ShiftDetail
  afternoon: ShiftDetail
  night: ShiftDetail
  totalTickets: number
  totalHU: number
  totalQty: number
  sharePercentage: number
}

interface ShiftSummary {
  key: 'morning' | 'afternoon' | 'night'
  name: string
  label: string
  hours: string
  tickets: number
  huCount: number
  totalQty: number
  operatorsCount: number
  percentage: number
  color: string
  bgLight: string
  borderColor: string
}

export function ProductionByShift() {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortField, setSortField] = useState<'totalTickets' | 'totalHU' | 'matricule'>('totalTickets')
  const [sortAsc, setSortAsc] = useState<boolean>(false)
  const [data, setData] = useState<{
    date: string
    availableDates: { date: string; count: number }[]
    grandTotal: {
      date: string
      totalTickets: number
      totalHU: number
      totalQty: number
      totalOperators: number
    }
    shifts: ShiftSummary[]
    operators: OperatorProd[]
  } | null>(null)

  const fetchProduction = async (dateParam?: string) => {
    setLoading(true)
    try {
      const url = dateParam
        ? `/api/stats/production-by-shift?date=${dateParam}`
        : `/api/stats/production-by-shift`
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error('Erreur lors du chargement des données')
      const json = await res.json()
      setData(json)
      if (json.date && !dateParam) {
        setSelectedDate(json.date)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Impossible de charger la production par shift')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduction()
  }, [])

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    fetchProduction(newDate)
  }

  // Filter & sort operators
  const filteredOperators = useMemo(() => {
    if (!data?.operators) return []
    let list = data.operators.filter((op) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        op.matricule.toLowerCase().includes(q) ||
        op.operatorName.toLowerCase().includes(q)
      )
    })

    list.sort((a, b) => {
      let valA: any = a[sortField]
      let valB: any = b[sortField]
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortAsc ? valA - valB : valB - valA
    })

    return list
  }, [data?.operators, searchQuery, sortField, sortAsc])

  const toggleSort = (field: 'totalTickets' | 'totalHU' | 'matricule') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  // Export current table view as CSV / Excel compatible
  const exportToCSV = () => {
    if (!data || !filteredOperators.length) return
    const headers = [
      'Matricule',
      'Nom Opérateur',
      'Matin T-Codes',
      'Matin HU',
      'Après-midi T-Codes',
      'Après-midi HU',
      'Nuit T-Codes',
      'Nuit HU',
      'Total T-Codes',
      'Total HU',
      '% Part Production',
    ]

    const rows = filteredOperators.map((op) => [
      op.matricule,
      `"${op.operatorName}"`,
      op.morning.tickets,
      op.morning.huCount,
      op.afternoon.tickets,
      op.afternoon.huCount,
      op.night.tickets,
      op.night.huCount,
      op.totalTickets,
      op.totalHU,
      `${op.sharePercentage}%`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `production_shifts_${selectedDate || 'globale'}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Données exportées avec succès')
  }

  const shiftsMap = useMemo(() => {
    if (!data?.shifts) return {}
    const map: Record<string, ShiftSummary> = {}
    data.shifts.forEach((s) => {
      map[s.key] = s
    })
    return map
  }, [data?.shifts])

  return (
    <Card className="w-full shadow-xl border-2 overflow-hidden bg-card">
      {/* Top Accent Gradient */}
      <div className="h-1.5 bg-gradient-to-r from-sky-500 via-amber-500 to-purple-600" />

      {/* Header & Controls Toolbar */}
      <CardHeader className="bg-gradient-to-br from-muted/40 via-background to-muted/20 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold tracking-tight">
                Production par Shift & par Opérateur
              </CardTitle>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-semibold text-xs">
                3 Shifts (24h)
              </Badge>
            </div>
            <CardDescription className="text-xs md:text-sm">
              Suivi détaillé des volumes préparés par poste de travail (Matin, Après-midi, Nuit) et par chaque opérateur
            </CardDescription>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1 shadow-xs hover:border-purple-400 transition-colors">
              <Calendar className="h-4 w-4 text-purple-600 shrink-0" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border-0 p-0 h-6 w-32 shadow-none focus-visible:ring-0 text-xs font-semibold cursor-pointer"
              />
            </div>

            {/* Quick shortcuts */}
            {data?.availableDates?.[0] && (
              <Button
                variant={selectedDate === data.availableDates[0].date ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateChange(data.availableDates[0].date)}
                className="h-8 px-2.5 text-xs font-medium cursor-pointer"
                title={`Dernière date avec données : ${data.availableDates[0].date}`}
              >
                Dernière activité ({data.availableDates[0].date.slice(5)})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10)
                handleDateChange(today)
              }}
              className="h-8 px-2.5 text-xs font-medium cursor-pointer"
            >
              Aujourd'hui
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProduction(selectedDate)}
              className="h-8 px-2.5 text-xs font-medium cursor-pointer gap-1.5"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
              Actualiser
            </Button>

            <Button
              size="sm"
              onClick={exportToCSV}
              disabled={!filteredOperators.length}
              className="h-8 px-3 text-xs font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Exporter
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-10 w-10 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Chargement de la production par shift...</p>
          </div>
        ) : !data || data.grandTotal.totalTickets === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/10 text-center gap-2">
            <Calendar className="h-8 w-8 text-muted-foreground/40" />
            <p className="font-semibold text-sm">Aucune production enregistrée pour le {selectedDate || "cette date"}</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Sélectionnez une autre date ci-dessus ou cliquez sur « Dernière activité » pour consulter les données historiques.
            </p>
            {data?.availableDates?.[0] && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(data.availableDates[0].date)}
                className="mt-2 text-xs font-semibold"
              >
                Voir la dernière activité ({data.availableDates[0].date})
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* 4 Shift KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Shift 1 - Matin */}
              <div className="relative overflow-hidden p-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-gradient-to-br from-sky-50/80 to-background dark:from-sky-950/20 dark:to-card shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                      <Sunrise className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sky-900 dark:text-sky-300 uppercase tracking-wide">Matin</p>
                      <p className="text-[11px] text-muted-foreground">06:00 - 14:00</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-semibold text-xs bg-sky-100/70 text-sky-800 border-sky-300">
                    {shiftsMap.morning?.percentage || 0}% prod
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {shiftsMap.morning?.tickets.toLocaleString() || 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">T-Codes</span>
                </div>
                <div className="mt-2 pt-2 border-t border-sky-200/50 dark:border-sky-900/30 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-sky-600" />
                    <b>{shiftsMap.morning?.huCount || 0}</b> HU
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-sky-600" />
                    <b>{shiftsMap.morning?.operatorsCount || 0}</b> op.
                  </span>
                </div>
              </div>

              {/* Shift 2 - Après-midi */}
              <div className="relative overflow-hidden p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/80 to-background dark:from-amber-950/20 dark:to-card shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide">Après-midi</p>
                      <p className="text-[11px] text-muted-foreground">14:00 - 22:00</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-semibold text-xs bg-amber-100/70 text-amber-800 border-amber-300">
                    {shiftsMap.afternoon?.percentage || 0}% prod
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {shiftsMap.afternoon?.tickets.toLocaleString() || 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">T-Codes</span>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-900/30 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-amber-600" />
                    <b>{shiftsMap.afternoon?.huCount || 0}</b> HU
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-amber-600" />
                    <b>{shiftsMap.afternoon?.operatorsCount || 0}</b> op.
                  </span>
                </div>
              </div>

              {/* Shift 3 - Nuit */}
              <div className="relative overflow-hidden p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/80 to-background dark:from-purple-950/20 dark:to-card shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wide">Nuit</p>
                      <p className="text-[11px] text-muted-foreground">22:00 - 06:00</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-semibold text-xs bg-purple-100/70 text-purple-800 border-purple-300">
                    {shiftsMap.night?.percentage || 0}% prod
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">
                    {shiftsMap.night?.tickets.toLocaleString() || 0}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">T-Codes</span>
                </div>
                <div className="mt-2 pt-2 border-t border-purple-200/50 dark:border-purple-900/30 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-purple-600" />
                    <b>{shiftsMap.night?.huCount || 0}</b> HU
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-purple-600" />
                    <b>{shiftsMap.night?.operatorsCount || 0}</b> op.
                  </span>
                </div>
              </div>

              {/* Total Journée */}
              <div className="relative overflow-hidden p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/80 to-background dark:from-emerald-950/20 dark:to-card shadow-xs hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide">Total Journée</p>
                      <p className="text-[11px] text-muted-foreground">3 Postes combinés</p>
                    </div>
                  </div>
                  <Badge className="font-semibold text-xs bg-emerald-600 text-white">
                    100%
                  </Badge>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {data.grandTotal.totalTickets.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Total Codes</span>
                </div>
                <div className="mt-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/30 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-emerald-600" />
                    <b>{data.grandTotal.totalHU}</b> Total HU
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-emerald-600" />
                    <b>{data.grandTotal.totalOperators}</b> Opérateurs
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Shift Distribution Bar */}
            <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/70">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Répartition de la production par poste :</span>
                <span className="text-foreground">{data.grandTotal.totalTickets} T-Codes au total</span>
              </div>
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-muted">
                <div
                  style={{ width: `${shiftsMap.morning?.percentage || 0}%` }}
                  className="bg-sky-500 hover:opacity-90 transition-all"
                  title={`Matin: ${shiftsMap.morning?.tickets} (${shiftsMap.morning?.percentage}%)`}
                />
                <div
                  style={{ width: `${shiftsMap.afternoon?.percentage || 0}%` }}
                  className="bg-amber-500 hover:opacity-90 transition-all"
                  title={`Après-midi: ${shiftsMap.afternoon?.tickets} (${shiftsMap.afternoon?.percentage}%)`}
                />
                <div
                  style={{ width: `${shiftsMap.night?.percentage || 0}%` }}
                  className="bg-purple-600 hover:opacity-90 transition-all"
                  title={`Nuit: ${shiftsMap.night?.tickets} (${shiftsMap.night?.percentage}%)`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <span>Matin ({shiftsMap.morning?.percentage || 0}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Après-midi ({shiftsMap.afternoon?.percentage || 0}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-600" />
                  <span>Nuit ({shiftsMap.night?.percentage || 0}%)</span>
                </div>
              </div>
            </div>

            {/* Detailed Table by Operator */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-purple-600" />
                    Production individuelle par opérateur ({filteredOperators.length})
                  </h4>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Filtrer matricule, nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-lg"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border/80 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead
                          onClick={() => toggleSort('matricule')}
                          className="text-[11px] font-bold uppercase tracking-wider py-3 cursor-pointer hover:text-foreground"
                        >
                          <span className="flex items-center gap-1">
                            Opérateur
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 py-3 text-center bg-sky-50/40 dark:bg-sky-950/20">
                          🌅 Matin (06-14h)
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 py-3 text-center bg-amber-50/40 dark:bg-amber-950/20">
                          ☀️ Après-midi (14-22h)
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 py-3 text-center bg-purple-50/40 dark:bg-purple-950/20">
                          🌙 Nuit (22-06h)
                        </TableHead>
                        <TableHead
                          onClick={() => toggleSort('totalHU')}
                          className="text-[11px] font-bold uppercase tracking-wider py-3 text-center cursor-pointer hover:text-foreground"
                        >
                          <span className="flex items-center justify-center gap-1">
                            Total HU
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => toggleSort('totalTickets')}
                          className="text-[11px] font-bold uppercase tracking-wider py-3 text-center cursor-pointer hover:text-foreground"
                        >
                          <span className="flex items-center justify-center gap-1">
                            Total T-Codes
                            <ArrowUpDown className="h-3 w-3" />
                          </span>
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3 text-right pr-4">
                          % Part de Prod
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOperators.map((op, i) => (
                        <TableRow
                          key={op.matricule}
                          className={`text-xs transition-colors ${
                            i % 2 === 0
                              ? 'bg-background hover:bg-muted/30'
                              : 'bg-muted/15 hover:bg-muted/40'
                          }`}
                        >
                          {/* Operator */}
                          <TableCell className="py-2.5 font-medium">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-bold flex items-center justify-center text-[11px] shadow-xs">
                                {op.matricule.slice(0, 3)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-xs">{op.matricule}</p>
                                <p className="text-[11px] text-muted-foreground leading-none mt-0.5">{op.operatorName}</p>
                              </div>
                            </div>
                          </TableCell>

                          {/* Matin */}
                          <TableCell className="py-2.5 text-center bg-sky-50/20 dark:bg-sky-950/10">
                            {op.morning.tickets > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-sky-800 dark:text-sky-300 font-mono text-xs">
                                  {op.morning.tickets} codes
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {op.morning.huCount} HU
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </TableCell>

                          {/* Après-midi */}
                          <TableCell className="py-2.5 text-center bg-amber-50/20 dark:bg-amber-950/10">
                            {op.afternoon.tickets > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-amber-800 dark:text-amber-300 font-mono text-xs">
                                  {op.afternoon.tickets} codes
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {op.afternoon.huCount} HU
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </TableCell>

                          {/* Nuit */}
                          <TableCell className="py-2.5 text-center bg-purple-50/20 dark:bg-purple-950/10">
                            {op.night.tickets > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-purple-800 dark:text-purple-300 font-mono text-xs">
                                  {op.night.tickets} codes
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {op.night.huCount} HU
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </TableCell>

                          {/* Total HU */}
                          <TableCell className="py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 font-semibold text-xs text-foreground px-2 py-0.5 rounded-md bg-muted/60">
                              <Package className="h-3 w-3 text-emerald-600" />
                              {op.totalHU}
                            </span>
                          </TableCell>

                          {/* Total Tickets */}
                          <TableCell className="py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-xs text-purple-800 dark:text-purple-300 px-2.5 py-0.5 rounded-md bg-purple-100/70 dark:bg-purple-950/60 font-mono">
                              <Barcode className="h-3 w-3" />
                              {op.totalTickets}
                            </span>
                          </TableCell>

                          {/* Share & Progress */}
                          <TableCell className="py-2.5 text-right pr-4">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"
                                  style={{ width: `${Math.min(100, op.sharePercentage * 2.5)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-xs text-foreground w-8 text-right">
                                {op.sharePercentage}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
