import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AddReferenceForm } from '@/features/references'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Layers,
  Box,
  Hash,
  FileText,
  Sparkles,
  SlidersHorizontal,
  X
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/references')({
  component: ReferencesPage,
})

interface Part {
  id: number
  learPN: string
  sarbiaPN?: string
  tescaPN: string
  desc: string
  qtyPerBox?: number
  createdAt: string
  updatedAt: string
}

function ReferencesPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)

  // Delete confirm state
  const [partToDelete, setPartToDelete] = useState<Part | null>(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchParts = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/parts/search', {
        withCredentials: true,
        params: {
          q: debouncedQuery,
          page,
          limit: 10,
        },
      })

      const { data: parts, totalPages: total, totalItems: items } = response.data
      setData(parts || [])
      setTotalPages(total || 1)
      setTotalItems(items || 0)
    } catch (error) {
      console.error('Error fetching parts:', error)
      toast.error('Failed to load references')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParts()
  }, [page, debouncedQuery])

  const handleDelete = async () => {
    if (!partToDelete) return

    try {
      await axios.delete(`/api/parts/${partToDelete.id}`, { withCredentials: true })
      toast.success('Référence supprimée avec succès')
      fetchParts()
    } catch (error) {
      console.error('Error deleting part:', error)
      toast.error('Échec de la suppression de la référence')
    } finally {
      setPartToDelete(null)
    }
  }

  const handleEdit = (part: Part) => {
    setEditingPart(part)
    setIsAddDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingPart(null)
    setIsAddDialogOpen(true)
  }

  const onFormSuccess = () => {
    setIsAddDialogOpen(false)
    fetchParts()
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`Copié : ${text}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
  }

  return (
    <Main>
      {/* Background Animated Gradient Mesh */}
      <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950/5 dark:bg-slate-950/40 p-4 md:p-8">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="pointer-events-none absolute top-1/3 -left-40 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-orange-600/15 via-yellow-500/10 to-transparent blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-1/4 h-80 w-80 rounded-full bg-gradient-to-tl from-amber-400/15 to-transparent blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          {/* Hero Header Card with MUI Elevation & Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 md:p-8 text-white shadow-2xl shadow-orange-950/20 backdrop-blur-xl"
          >
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-md border border-white/20 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                  <span>Gestion des Pièces & Références</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 drop-shadow-sm">
                  <Layers className="h-8 w-8 md:h-10 md:w-10 text-amber-200" />
                  {t('references.title') || 'Catalogue des Références'}
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-amber-100 font-medium leading-relaxed">
                  {t('references.subtitle') || 'Consultez, recherchez et gérez l’ensemble des codes LEAR, SARBIA et TESCA avec conditionnement.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAdd}
                  className="flex items-center justify-center gap-2.5 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-orange-700 shadow-xl hover:bg-amber-50 hover:shadow-2xl transition-all border border-white/60 cursor-pointer"
                >
                  <Plus className="h-5 w-5" />
                  <span>{t('references.addReference') || 'Nouvelle Référence'}</span>
                </motion.button>
              </div>
            </div>

            {/* Quick Stats Chips */}
            <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center gap-3 sm:gap-6 text-xs md:text-sm font-medium">
              <div className="flex items-center gap-2 bg-black/15 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Hash className="h-4 w-4 text-amber-300" />
                <span>Total Enregistrements :</span>
                <span className="font-bold text-white text-base">{totalItems}</span>
              </div>
              <div className="flex items-center gap-2 bg-black/15 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Box className="h-4 w-4 text-yellow-300" />
                <span>Page Actuelle :</span>
                <span className="font-bold text-white">{page} / {totalPages || 1}</span>
              </div>
            </div>
          </motion.div>

          {/* Search & Action Toolbar with Material Design Filter Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 md:p-5 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-lg"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search Bar with Adornment */}
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                <Input
                  placeholder="Rechercher par LEAR, SARBIA, TESCA ou Description..."
                  className="pl-10 pr-10 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 focus-visible:ring-2 focus-visible:ring-orange-500 font-medium text-sm transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Refresh & Filter Controls */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  variant="outline"
                  onClick={fetchParts}
                  disabled={loading}
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-slate-700 dark:text-slate-200 font-medium px-4 shadow-sm transition-all hover:border-orange-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 text-orange-600 ${loading ? 'animate-spin' : ''}`} />
                  {t('common.refresh') || 'Actualiser'}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Animated Table Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-slate-200/60 dark:shadow-none backdrop-blur-md"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                {/* MUI-styled Table Header */}
                <thead>
                  <tr className="border-b border-orange-200/60 dark:border-orange-900/30 bg-gradient-to-r from-orange-50/80 via-amber-50/60 to-orange-50/80 dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-800/80">
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300">#</span>
                        <span>LEAR PN</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300">#</span>
                        <span>SARBIA PN</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300">#</span>
                        <span>TESCA PN</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span>{t('references.description') || 'Description'}</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-right text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                      <div className="flex items-center justify-end gap-2">
                        <Box className="h-4 w-4 text-orange-500" />
                        <span>{t('references.qtyPerBox') || 'QTY/BOX'}</span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-24">
                      <span>{t('common.actions') || 'Actions'}</span>
                    </th>
                  </tr>
                </thead>

                {/* Table Body with Framer Motion Stagger */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100/80 dark:bg-orange-950/50 text-orange-600 shadow-inner">
                            <RefreshCw className="h-7 w-7 animate-spin" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                              {t('references.loadingReferences') || 'Chargement des références...'}
                            </p>
                            <p className="text-xs text-slate-400">Veuillez patienter quelques instants</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                            <Search className="h-8 w-8" />
                          </div>
                          <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                            {t('references.noReferencesFound') || 'Aucune référence trouvée'}
                          </p>
                          <p className="text-xs text-slate-400 max-w-sm">
                            Essayez de modifier vos termes de recherche ou ajoutez une nouvelle pièce.
                          </p>
                          <Button
                            onClick={handleAdd}
                            variant="outline"
                            className="mt-2 rounded-xl border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Ajouter une référence
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((part, index) => (
                      <motion.tr
                        key={part.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        whileHover={{ backgroundColor: 'rgba(254, 243, 199, 0.25)' }}
                        className="group transition-colors duration-150"
                      >
                        {/* LEAR PN */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                              {part.learPN}
                            </span>
                            <button
                              onClick={() => handleCopy(part.learPN, `lear-${part.id}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-orange-600 rounded"
                              title="Copier LEAR PN"
                            >
                              {copiedId === `lear-${part.id}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* SARBIA PN */}
                        <td className="py-4 px-5">
                          {part.sarbiaPN ? (
                            <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 font-mono text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                              {part.sarbiaPN}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono text-sm dark:text-slate-600">-</span>
                          )}
                        </td>

                        {/* TESCA PN */}
                        <td className="py-4 px-5">
                          <span className="font-mono text-sm font-semibold text-amber-800 dark:text-amber-400">
                            {part.tescaPN}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-5">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">
                            {part.desc}
                          </span>
                        </td>

                        {/* QTY/BOX Chip (MUI pill badge) */}
                        <td className="py-4 px-5 text-right">
                          <motion.span
                            whileHover={{ scale: 1.1 }}
                            className="inline-flex items-center justify-center min-w-[2.25rem] px-3 py-1 rounded-full text-xs font-extrabold text-white shadow-md shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-amber-500 cursor-default"
                          >
                            {part.qtyPerBox ?? '-'}
                          </motion.span>
                        </td>

                        {/* Action Menu */}
                        <td className="py-4 px-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 rounded-full hover:bg-orange-100 dark:hover:bg-orange-950/50 hover:text-orange-700 text-slate-500 transition-colors"
                              >
                                <span className="sr-only">Actions</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-200 shadow-xl">
                              <DropdownMenuLabel className="text-xs text-slate-400 uppercase tracking-wider">
                                {t('common.actions') || 'Actions'}
                              </DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => handleEdit(part)}
                                className="cursor-pointer font-medium text-sm flex items-center gap-2"
                              >
                                <Pencil className="h-4 w-4 text-amber-600" />
                                <span>{t('common.edit') || 'Modifier'}</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setPartToDelete(part)}
                                className="cursor-pointer font-medium text-sm flex items-center gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>{t('common.delete') || 'Supprimer'}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* MUI-styled Pagination Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="text-xs md:text-sm text-slate-500 font-medium">
                {t('common.showing') || 'Affichage de'} <span className="font-bold text-slate-800 dark:text-white">{data.length}</span> {t('common.of') || 'sur'}{' '}
                <span className="font-bold text-slate-800 dark:text-white">{totalItems}</span> {t('common.entries') || 'références'}
              </div>

              {/* Segmented Page Buttons */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                  className="h-8.5 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-slate-600 disabled:opacity-40"
                  title="Première page"
                >
                  <ChevronLeft className="h-4 w-4 -mr-1.5" />
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="h-8.5 px-3 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-slate-600 font-medium disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>{t('common.previous') || 'Précédent'}</span>
                </Button>

                <div className="flex items-center gap-1 mx-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }

                    const isActive = page === pageNum
                    return (
                      <motion.button
                        key={pageNum}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                        className={`h-8.5 min-w-[2.125rem] px-2 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-500/30'
                            : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {pageNum}
                      </motion.button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="h-8.5 px-3 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-slate-600 font-medium disabled:opacity-40"
                >
                  <span>{t('common.next') || 'Suivant'}</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages || loading}
                  className="h-8.5 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-slate-600 disabled:opacity-40"
                  title="Dernière page"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-1.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Add/Edit Modal */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl sm:max-w-2xl rounded-3xl border-slate-200/80 shadow-2xl backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="hidden">{t('references.referenceForm')}</DialogTitle>
            </DialogHeader>
            <div className="pt-2">
              <AddReferenceForm
                initialData={editingPart}
                onSuccess={onFormSuccess}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog open={!!partToDelete} onOpenChange={(open) => !open && setPartToDelete(null)}>
          <AlertDialogContent className="rounded-3xl border-slate-200 shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                {t('common.areYouSure') || 'Êtes-vous sûr ?'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-300">
                {t('common.cannotBeUndone') || 'Cette action est irréversible.'}{' '}
                {t('references.deleteConfirm') || 'Voulez-vous supprimer la référence'}{' '}
                <span className="font-bold text-orange-600"> {partToDelete?.learPN} </span> ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl border-slate-200">{t('common.cancel') || 'Annuler'}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/30"
              >
                {t('common.delete') || 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Main>
  )
}

