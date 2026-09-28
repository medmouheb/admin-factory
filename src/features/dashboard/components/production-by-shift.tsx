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
  Award,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trophy,
  Sparkles,
  X,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all')
  const [sortField, setSortField] = useState<'totalTickets' | 'totalHU' | 'matricule' | 'sharePercentage'>('totalTickets')
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
      // Search filter
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        op.matricule.toLowerCase().includes(q) ||
        op.operatorName.toLowerCase().includes(q)

      // Shift filter
      let matchShift = true
      if (shiftFilter === 'morning') matchShift = op.morning.tickets > 0
      if (shiftFilter === 'afternoon') matchShift = op.afternoon.tickets > 0
      if (shiftFilter === 'night') matchShift = op.night.tickets > 0

      return matchSearch && matchShift
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
  }, [data?.operators, searchQuery, shiftFilter, sortField, sortAsc])

  const toggleSort = (field: 'totalTickets' | 'totalHU' | 'matricule' | 'sharePercentage') => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  }

  return (
    <Card className="w-full shadow-2xl border border-border/80 overflow-hidden bg-card/95 backdrop-blur-md rounded-2xl transition-all duration-300">
      {/* Top Ambient Glow Gradient */}
      <div className="h-1.5 bg-gradient-to-r from-sky-500 via-amber-500 via-purple-600 to-emerald-500 shadow-sm" />

      {/* Header & Controls Toolbar */}
      <CardHeader className="bg-gradient-to-b from-muted/50 via-background to-background/40 pb-5 border-b border-border/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20"
              >
                <Layers className="h-5 w-5" />
              </motion.div>
              <CardTitle className="text-xl md:text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
                Production par Shift & par Opérateur
              </CardTitle>
              <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 font-bold text-[11px] px-2.5 py-0.5 shadow-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" />
                3 Shifts (24h)
              </Badge>
            </div>
            <CardDescription className="text-xs md:text-sm text-muted-foreground">
              Suivi interactif et analyse en temps réel des Unités de Manutention (HU) et T-Codes par poste de travail
            </CardDescription>
          </div>

          {/* Interactive Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-background/90 border border-border/80 hover:border-purple-400 rounded-xl px-3 py-1.5 shadow-xs transition-all duration-200">
              <Calendar className="h-4 w-4 text-purple-600 shrink-0" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="border-0 p-0 h-6 w-32 shadow-none focus-visible:ring-0 text-xs font-bold cursor-pointer bg-transparent text-foreground"
              />
            </div>

            {/* Quick shortcuts */}
            {data?.availableDates?.[0] && (
              <Button
                variant={selectedDate === data.availableDates[0].date ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateChange(data.availableDates[0].date)}
                className={`h-9 px-3 text-xs font-semibold rounded-xl cursor-pointer transition-all ${
                  selectedDate === data.availableDates[0].date
                    ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20'
                    : 'hover:bg-purple-50 dark:hover:bg-purple-950/30'
                }`}
                title={`Dernière date avec données : ${data.availableDates[0].date}`}
              >
                <Activity className="h-3.5 w-3.5 mr-1 text-purple-400" />
                Dernière ({data.availableDates[0].date.slice(5)})
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10)
                handleDateChange(today)
              }}
              className="h-9 px-3 text-xs font-semibold rounded-xl cursor-pointer hover:bg-muted/70 transition-all"
            >
              Aujourd'hui
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProduction(selectedDate)}
              className="h-9 px-3 text-xs font-semibold rounded-xl cursor-pointer gap-1.5 hover:bg-muted/70 transition-all"
              title="Rafraîchir"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>

            <Button
              size="sm"
              onClick={exportToCSV}
              disabled={!filteredOperators.length}
              className="h-9 px-3.5 text-xs font-bold gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 rounded-xl cursor-pointer transition-all duration-200"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Exporter
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-2xl border-4 border-purple-200 border-t-purple-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Layers className="h-4 w-4 text-purple-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-foreground">Chargement des données de production...</p>
              <p className="text-xs text-muted-foreground">Calcul des shifts et agrégations par opérateur</p>
            </div>
          </div>
        ) : !data || data.grandTotal.totalTickets === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-border/80 rounded-2xl bg-muted/10 text-center gap-3"
          >
            <div className="p-3.5 rounded-full bg-muted/60 text-muted-foreground">
              <Calendar className="h-8 w-8" />
            </div>
            <p className="font-bold text-base text-foreground">Aucune production enregistrée pour le {selectedDate || 'cette date'}</p>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Aucun ticket code ni unité de manutention n'a été scanné à cette date. Vous pouvez sélectionner une autre date ci-dessus ou basculer vers la dernière activité enregistrée.
            </p>
            {data?.availableDates?.[0] && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleDateChange(data.availableDates[0].date)}
                className="mt-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
              >
                Consulter la dernière activité ({data.availableDates[0].date})
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {/* 4 Animated Shift KPI Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Shift 1 - Matin */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden p-4 rounded-2xl border border-sky-200/80 dark:border-sky-900/60 bg-gradient-to-br from-sky-50/90 via-background to-sky-100/20 dark:from-sky-950/30 dark:via-card dark:to-sky-900/10 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shadow-xs">
                      <Sunrise className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sky-950 dark:text-sky-300 uppercase tracking-wide">Matin</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="h-2.5 w-2.5" /> 06:00 - 14:00
                      </p>
                    </div>
                  </div>
                  <Badge className="font-bold text-[11px] bg-sky-100 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700">
                    {shiftsMap.morning?.percentage || 0}%
                  </Badge>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-foreground tracking-tight font-mono">
                    {shiftsMap.morning?.tickets.toLocaleString() || 0}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">T-Codes / HU</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-sky-200/60 dark:border-sky-900/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Package className="h-3 w-3 text-sky-600" />
                    <b className="text-foreground font-mono">{shiftsMap.morning?.huCount || 0}</b> HU
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3 w-3 text-sky-600" />
                    <b className="text-foreground font-mono">{shiftsMap.morning?.operatorsCount || 0}</b> op.
                  </span>
                </div>
              </motion.div>

              {/* Shift 2 - Après-midi */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/90 via-background to-amber-100/20 dark:from-amber-950/30 dark:via-card dark:to-amber-900/10 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shadow-xs">
                      <Sun className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wide">Après-midi</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="h-2.5 w-2.5" /> 14:00 - 22:00
                      </p>
                    </div>
                  </div>
                  <Badge className="font-bold text-[11px] bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700">
                    {shiftsMap.afternoon?.percentage || 0}%
                  </Badge>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-foreground tracking-tight font-mono">
                    {shiftsMap.afternoon?.tickets.toLocaleString() || 0}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">T-Codes / HU</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Package className="h-3 w-3 text-amber-600" />
                    <b className="text-foreground font-mono">{shiftsMap.afternoon?.huCount || 0}</b> HU
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3 w-3 text-amber-600" />
                    <b className="text-foreground font-mono">{shiftsMap.afternoon?.operatorsCount || 0}</b> op.
                  </span>
                </div>
              </motion.div>

              {/* Shift 3 - Nuit */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/90 via-background to-purple-100/20 dark:from-purple-950/30 dark:via-card dark:to-purple-900/10 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shadow-xs">
                      <Moon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-950 dark:text-purple-300 uppercase tracking-wide">Nuit</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="h-2.5 w-2.5" /> 22:00 - 06:00
                      </p>
                    </div>
                  </div>
                  <Badge className="font-bold text-[11px] bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700">
                    {shiftsMap.night?.percentage || 0}%
                  </Badge>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-foreground tracking-tight font-mono">
                    {shiftsMap.night?.tickets.toLocaleString() || 0}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">T-Codes / HU</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Package className="h-3 w-3 text-purple-600" />
                    <b className="text-foreground font-mono">{shiftsMap.night?.huCount || 0}</b> HU
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3 w-3 text-purple-600" />
                    <b className="text-foreground font-mono">{shiftsMap.night?.operatorsCount || 0}</b> op.
                  </span>
                </div>
              </motion.div>

              {/* Total Journée */}
              <motion.div
                variants={itemVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50/90 via-background to-emerald-100/20 dark:from-emerald-950/30 dark:via-card dark:to-emerald-900/10 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shadow-xs">
                      <Award className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wide">Total Journée</p>
                      <p className="text-[11px] text-muted-foreground font-medium">3 Postes combinés</p>
                    </div>
                  </div>
                  <Badge className="font-bold text-[11px] bg-emerald-600 text-white shadow-xs">
                    100%
                  </Badge>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight font-mono">
                    {data.grandTotal.totalTickets.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Package className="h-3 w-3 text-emerald-600" />
                    <b className="text-foreground font-mono">{data.grandTotal.totalHU}</b> HU
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Users className="h-3 w-3 text-emerald-600" />
                    <b className="text-foreground font-mono">{data.grandTotal.totalOperators}</b> Opérateurs
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual Shift Distribution Animated Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2 p-4 rounded-2xl bg-muted/20 border border-border/80 shadow-xs backdrop-blur-xs"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-600" />
                  Répartition de la production par poste :
                </span>
                <span className="text-foreground font-mono">{data.grandTotal.totalTickets} T-Codes / HU au total</span>
              </div>
              <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-muted/60 p-0.5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${shiftsMap.morning?.percentage || 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-l-full relative group cursor-pointer"
                  title={`Matin: ${shiftsMap.morning?.tickets} (${shiftsMap.morning?.percentage}%)`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${shiftsMap.afternoon?.percentage || 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 relative group cursor-pointer"
                  title={`Après-midi: ${shiftsMap.afternoon?.tickets} (${shiftsMap.afternoon?.percentage}%)`}
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${shiftsMap.night?.percentage || 0}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-r-full relative group cursor-pointer"
                  title={`Nuit: ${shiftsMap.night?.tickets} (${shiftsMap.night?.percentage}%)`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-xs" />
                  <span className="font-semibold text-foreground">Matin</span>
                  <span>({shiftsMap.morning?.percentage || 0}% — {shiftsMap.morning?.tickets || 0} codes)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-xs" />
                  <span className="font-semibold text-foreground">Après-midi</span>
                  <span>({shiftsMap.afternoon?.percentage || 0}% — {shiftsMap.afternoon?.tickets || 0} codes)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-600 shadow-xs" />
                  <span className="font-semibold text-foreground">Nuit</span>
                  <span>({shiftsMap.night?.percentage || 0}% — {shiftsMap.night?.tickets || 0} codes)</span>
                </div>
              </div>
            </motion.div>

            {/* Detailed Table Header & Filters */}
            <div className="space-y-3.5 pt-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                      Détail de la production par opérateur
                      <Badge variant="secondary" className="font-bold text-xs rounded-full px-2">
                        {filteredOperators.length}
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-muted-foreground">Classement et ventilation par shift de travail</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Shift filter tabs */}
                  <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/60 text-xs">
                    <button
                      onClick={() => setShiftFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        shiftFilter === 'all'
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setShiftFilter('morning')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        shiftFilter === 'morning'
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-sky-600'
                      }`}
                    >
                      🌅 Matin
                    </button>
                    <button
                      onClick={() => setShiftFilter('afternoon')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        shiftFilter === 'afternoon'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-amber-600'
                      }`}
                    >
                      ☀️ A-M
                    </button>
                    <button
                      onClick={() => setShiftFilter('night')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        shiftFilter === 'night'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-purple-600'
                      }`}
                    >
                      🌙 Nuit
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative w-full sm:w-60">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Rechercher matricule, nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8.5 pl-8.5 pr-8 text-xs rounded-xl border-border/80 bg-background/90"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* High Quality Animated Table */}
              <div className="rounded-2xl border border-border/80 overflow-hidden shadow-lg bg-card/60 backdrop-blur-md">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/60 backdrop-blur-xs">
                      <TableRow className="hover:bg-transparent border-b border-border/80">
                        <TableHead
                          onClick={() => toggleSort('matricule')}
                          className="text-[11px] font-bold uppercase tracking-wider py-3.5 pl-4 cursor-pointer hover:text-purple-600 transition-colors select-none"
                        >
                          <span className="flex items-center gap-1.5">
                            Rang & Opérateur
                            {sortField === 'matricule' ? (
                              sortAsc ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </span>
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 py-3.5 text-center bg-sky-50/60 dark:bg-sky-950/30">
                          🌅 Matin (06-14h)
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 py-3.5 text-center bg-amber-50/60 dark:bg-amber-950/30">
                          ☀️ Après-midi (14-22h)
                        </TableHead>
                        <TableHead className="text-[11px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 py-3.5 text-center bg-purple-50/60 dark:bg-purple-950/30">
                          🌙 Nuit (22-06h)
                        </TableHead>
                        <TableHead
                          onClick={() => toggleSort('totalHU')}
                          className="text-[11px] font-bold uppercase tracking-wider py-3.5 text-center cursor-pointer hover:text-emerald-600 transition-colors select-none"
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            Total HU
                            {sortField === 'totalHU' ? (
                              sortAsc ? <ArrowUp className="h-3 w-3 text-emerald-600" /> : <ArrowDown className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => toggleSort('totalTickets')}
                          className="text-[11px] font-bold uppercase tracking-wider py-3.5 text-center cursor-pointer hover:text-purple-600 transition-colors select-none"
                        >
                          <span className="flex items-center justify-center gap-1.5">
                            Total T-Codes
                            {sortField === 'totalTickets' ? (
                              sortAsc ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </span>
                        </TableHead>
                        <TableHead
                          onClick={() => toggleSort('sharePercentage')}
                          className="text-[11px] font-bold uppercase tracking-wider py-3.5 text-right pr-4 cursor-pointer hover:text-purple-600 transition-colors select-none"
                        >
                          <span className="flex items-center justify-end gap-1.5">
                            % Part de Prod
                            {sortField === 'sharePercentage' ? (
                              sortAsc ? <ArrowUp className="h-3 w-3 text-purple-600" /> : <ArrowDown className="h-3 w-3 text-purple-600" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            )}
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      <AnimatePresence mode="wait">
                        {filteredOperators.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs font-semibold">
                              Aucun opérateur ne correspond à vos critères de recherche.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredOperators.map((op, i) => {
                            const isTop1 = i === 0 && !sortAsc && sortField === 'totalTickets'
                            const isTop2 = i === 1 && !sortAsc && sortField === 'totalTickets'
                            const isTop3 = i === 2 && !sortAsc && sortField === 'totalTickets'

                            return (
                              <motion.tr
                                key={op.matricule}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                                className={`text-xs border-b border-border/40 transition-all duration-200 group ${
                                  isTop1
                                    ? 'bg-amber-500/5 hover:bg-amber-500/10'
                                    : i % 2 === 0
                                    ? 'bg-background hover:bg-muted/40'
                                    : 'bg-muted/15 hover:bg-muted/50'
                                }`}
                              >
                                {/* Operator Info + Rank Badge */}
                                <TableCell className="py-3 pl-4 font-medium">
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <div
                                        className={`h-9 w-9 rounded-xl font-extrabold flex items-center justify-center text-xs shadow-xs text-white ${
                                          isTop1
                                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-amber-500/30 ring-2 ring-amber-400/40'
                                            : isTop2
                                            ? 'bg-gradient-to-tr from-slate-400 to-slate-300 ring-2 ring-slate-300/40 text-slate-900'
                                            : isTop3
                                            ? 'bg-gradient-to-tr from-amber-700 to-amber-600 ring-2 ring-amber-700/40'
                                            : 'bg-gradient-to-tr from-purple-700 to-indigo-600'
                                        }`}
                                      >
                                        {isTop1 ? (
                                          <Trophy className="h-4 w-4 text-white" />
                                        ) : (
                                          op.matricule.slice(0, 3)
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="font-extrabold text-foreground text-xs font-mono">{op.matricule}</p>
                                        {isTop1 && (
                                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 text-[10px] px-1.5 py-0 font-bold">
                                            #1 Top
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-muted-foreground leading-none mt-0.5 font-medium">
                                        {op.operatorName}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>

                                {/* Matin */}
                                <TableCell className="py-3 text-center bg-sky-50/30 dark:bg-sky-950/15 group-hover:bg-sky-100/30 transition-colors">
                                  {op.morning.tickets > 0 ? (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-extrabold text-sky-800 dark:text-sky-300 font-mono text-xs px-2 py-0.5 rounded-md bg-sky-100/80 dark:bg-sky-900/60 shadow-2xs">
                                        {op.morning.tickets} codes
                                      </span>
                                      <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                        {op.morning.huCount} HU
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/30 font-bold">—</span>
                                  )}
                                </TableCell>

                                {/* Après-midi */}
                                <TableCell className="py-3 text-center bg-amber-50/30 dark:bg-amber-950/15 group-hover:bg-amber-100/30 transition-colors">
                                  {op.afternoon.tickets > 0 ? (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-extrabold text-amber-800 dark:text-amber-300 font-mono text-xs px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-900/60 shadow-2xs">
                                        {op.afternoon.tickets} codes
                                      </span>
                                      <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                        {op.afternoon.huCount} HU
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/30 font-bold">—</span>
                                  )}
                                </TableCell>

                                {/* Nuit */}
                                <TableCell className="py-3 text-center bg-purple-50/30 dark:bg-purple-950/15 group-hover:bg-purple-100/30 transition-colors">
                                  {op.night.tickets > 0 ? (
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-extrabold text-purple-800 dark:text-purple-300 font-mono text-xs px-2 py-0.5 rounded-md bg-purple-100/80 dark:bg-purple-900/60 shadow-2xs">
                                        {op.night.tickets} codes
                                      </span>
                                      <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                        {op.night.huCount} HU
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground/30 font-bold">—</span>
                                  )}
                                </TableCell>

                                {/* Total HU */}
                                <TableCell className="py-3 text-center">
                                  <span className="inline-flex items-center gap-1.5 font-bold text-xs text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/70 font-mono shadow-2xs">
                                    <Package className="h-3 w-3 text-emerald-600" />
                                    {op.totalHU}
                                  </span>
                                </TableCell>

                                {/* Total T-Codes */}
                                <TableCell className="py-3 text-center">
                                  <span className="inline-flex items-center gap-1.5 font-bold text-xs text-purple-900 dark:text-purple-200 px-2.5 py-1 rounded-lg bg-purple-100/90 dark:bg-purple-950/80 font-mono shadow-2xs">
                                    <Barcode className="h-3 w-3 text-purple-600" />
                                    {op.totalTickets}
                                  </span>
                                </TableCell>

                                {/* Share & Animated Progress Bar */}
                                <TableCell className="py-3 text-right pr-4">
                                  <div className="flex items-center justify-end gap-2.5">
                                    <div className="w-20 h-2 rounded-full bg-muted/80 overflow-hidden shadow-inner p-0.5">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, op.sharePercentage * 2.5)}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${
                                          isTop1
                                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm'
                                            : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600'
                                        }`}
                                      />
                                    </div>
                                    <span className="font-extrabold text-xs text-foreground w-9 text-right font-mono">
                                      {op.sharePercentage}%
                                    </span>
                                  </div>
                                </TableCell>
                              </motion.tr>
                            )
                          })
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Footer totals */}
                <div className="bg-muted/40 px-4 py-3 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
                  <span>Affichage de {filteredOperators.length} sur {data.grandTotal.totalOperators} opérateur(s) actif(s)</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Package className="h-3.5 w-3.5 text-emerald-600" />
                      Total HU : <b className="font-mono text-emerald-600">{data.grandTotal.totalHU}</b>
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Barcode className="h-3.5 w-3.5 text-purple-600" />
                      Total T-Codes : <b className="font-mono text-purple-600">{data.grandTotal.totalTickets}</b>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
