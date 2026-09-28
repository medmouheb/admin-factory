import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AddMaterialForm } from '@/features/materials'
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
  Package,
  Layers,
  Sparkles,
  Hash,
  X,
  Database
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/_authenticated/materials')({
  component: MaterialsPage,
})

interface Material {
  id: number
  material: string
  materialDescription: string
  storageUn: string
  availStock: number
  createdAt: string
  updatedAt: string
}

function MaterialsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)

  // Delete confirm state
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/materials/search', {
        withCredentials: true,
        params: {
          q: debouncedQuery,
          page,
          limit: 10,
        },
      })

      const { data: materials, totalPages: total, totalItems: items } = response.data
      setData(materials || [])
      setTotalPages(total || 1)
      setTotalItems(items || 0)
    } catch (error) {
      console.error('Error fetching materials:', error)
      toast.error('Échec du chargement des matières')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [page, debouncedQuery])

  const handleDelete = async () => {
    if (!materialToDelete) return

    try {
      await axios.delete(`/api/materials/${materialToDelete.id}`, { withCredentials: true })
      toast.success('Matière première supprimée avec succès')
      fetchMaterials()
    } catch (error) {
      console.error('Error deleting material:', error)
      toast.error('Échec de la suppression de la matière')
    } finally {
      setMaterialToDelete(null)
    }
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setIsAddDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingMaterial(null)
    setIsAddDialogOpen(true)
  }

  const onFormSuccess = () => {
    setIsAddDialogOpen(false)
    fetchMaterials()
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`Copié : ${text}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Main>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero Header Card with MUI Elevation & Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-white/10 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 md:p-8 text-white shadow-2xl shadow-blue-950/20 backdrop-blur-xl"
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
                <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                <span>Gestion des Stocks & Matériaux</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 drop-shadow-sm">
                <Package className="h-8 w-8 md:h-10 md:w-10 text-blue-200" />
                {t('materials.title') || 'Catalogue des Matières'}
              </h1>
              <p className="max-w-2xl text-sm md:text-base text-blue-100 font-medium leading-relaxed">
                {t('materials.subtitle') || 'Consultez, recherchez et gérez l’ensemble des matières premières et stocks disponibles.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-xl hover:bg-blue-50 hover:shadow-2xl transition-all border border-white/60 cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span>{t('materials.addMaterial') || 'Nouvelle Matière'}</span>
              </motion.button>
            </div>
          </div>

          {/* Quick Stats Chips */}
          <div className="mt-6 pt-5 border-t border-white/20 flex flex-wrap items-center gap-3 sm:gap-6 text-xs md:text-sm font-medium">
            <div className="flex items-center gap-2 bg-black/15 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Hash className="h-4 w-4 text-blue-300" />
              <span>Total Matières :</span>
              <span className="font-bold text-white text-base">{totalItems}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/15 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
              <Database className="h-4 w-4 text-cyan-300" />
              <span>Page Actuelle :</span>
              <span className="font-bold text-white">{page} / {totalPages || 1}</span>
            </div>
          </div>
        </motion.div>

        {/* Search & Action Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-4 md:p-5 shadow-lg shadow-slate-200/50 dark:shadow-none backdrop-blur-lg"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Input
                placeholder="Rechercher par Code Matière, Description ou Emplacement..."
                className="pl-10 pr-10 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 focus-visible:ring-2 focus-visible:ring-blue-500 font-medium text-sm transition-all"
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

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                onClick={fetchMaterials}
                disabled={loading}
                className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-200 font-medium px-4 shadow-sm transition-all hover:border-blue-300"
              >
                <RefreshCw className={`h-4 w-4 mr-2 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
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
              <thead>
                <tr className="border-b border-blue-200/60 dark:border-blue-900/30 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80 dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-800/80">
                  <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">#</span>
                      <span>{t('materials.material') || 'Code Matière'}</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <span>{t('materials.description') || 'Description'}</span>
                  </th>
                  <th className="py-4 px-5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-500" />
                      <span>{t('materials.storage') || 'Emplacement'}</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-right text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    <div className="flex items-center justify-end gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span>{t('materials.availStock') || 'Stock Disponible'}</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 w-24">
                    <span>{t('common.actions') || 'Actions'}</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100/80 dark:bg-blue-950/50 text-blue-600 shadow-inner">
                          <RefreshCw className="h-7 w-7 animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                            {t('common.loadingData') || 'Chargement des matières...'}
                          </p>
                          <p className="text-xs text-slate-400">Veuillez patienter quelques instants</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <Search className="h-8 w-8" />
                        </div>
                        <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                          {t('common.noResults') || 'Aucune matière trouvée'}
                        </p>
                        <Button
                          onClick={handleAdd}
                          variant="outline"
                          className="mt-2 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Ajouter une matière
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.03 }}
                      whileHover={{ backgroundColor: 'rgba(239, 246, 255, 0.4)' }}
                      className="group transition-colors duration-150"
                    >
                      {/* Material Code */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                            {item.material}
                          </span>
                          <button
                            onClick={() => handleCopy(item.material, `mat-${item.id}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-blue-600 rounded"
                            title="Copier code matière"
                          >
                            {copiedId === `mat-${item.id}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-5">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.materialDescription}
                        </span>
                      </td>

                      {/* Storage Unit */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
                          {item.storageUn || '-'}
                        </span>
                      </td>

                      {/* Avail Stock Chip */}
                      <td className="py-4 px-5 text-right">
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          className={`inline-flex items-center justify-center min-w-[2.5rem] px-3 py-1 rounded-full text-xs font-extrabold text-white shadow-md cursor-default ${
                            item.availStock > 0
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20'
                              : 'bg-gradient-to-r from-rose-500 to-red-600 shadow-rose-500/20'
                          }`}
                        >
                          {item.availStock}
                        </motion.span>
                      </td>

                      {/* Actions Menu */}
                      <td className="py-4 px-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 rounded-full hover:bg-blue-100 dark:hover:bg-blue-950/50 hover:text-blue-700 text-slate-500 transition-colors"
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
                              onClick={() => handleEdit(item)}
                              className="cursor-pointer font-medium text-sm flex items-center gap-2"
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                              <span>{t('common.edit') || 'Modifier'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setMaterialToDelete(item)}
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
              <span className="font-bold text-slate-800 dark:text-white">{totalItems}</span> {t('common.entries') || 'matières'}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
                className="h-8.5 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-600 disabled:opacity-40"
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
                className="h-8.5 px-3 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-600 font-medium disabled:opacity-40"
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
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800'
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
                className="h-8.5 px-3 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-600 font-medium disabled:opacity-40"
              >
                <span>{t('common.next') || 'Suivant'}</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages || loading}
                className="h-8.5 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-600 disabled:opacity-40"
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
            <DialogTitle className="hidden">{t('materials.materialForm')}</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <AddMaterialForm
              initialData={editingMaterial}
              onSuccess={onFormSuccess}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!materialToDelete} onOpenChange={(open) => !open && setMaterialToDelete(null)}>
        <AlertDialogContent className="rounded-3xl border-slate-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
              {t('common.areYouSure') || 'Êtes-vous sûr ?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-300">
              {t('common.cannotBeUndone') || 'Cette action est irréversible.'}{' '}
              {t('materials.deleteConfirm') || 'Voulez-vous supprimer la matière'}{' '}
              <span className="font-bold text-blue-600"> {materialToDelete?.material} </span> ?
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
    </Main>
  )
}
