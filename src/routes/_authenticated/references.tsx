import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AddReferenceForm } from '@/features/references'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Pencil, Trash, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react'
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

  // Dialog states
  const [isaddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)

  // Delete confirm state
  const [partToDelete, setPartToDelete] = useState<Part | null>(null)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
      setPage(1) // Reset to page 1 on search
    }, 500)
    return () => clearTimeout(handler)
  }, [searchQuery])

  const fetchParts = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8080/api/parts/search', {
        withCredentials: true,
        params: {
          q: debouncedQuery,
          page,
          limit: 10
        }
      })

      const { data: parts, totalPages: total, totalItems: items } = response.data
      setData(parts)
      setTotalPages(total)
      setTotalItems(items)
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
      await axios.delete(`http://localhost:8080/api/parts/${partToDelete.id}`, { withCredentials: true })
      toast.success('Reference deleted successfully')
      fetchParts()
    } catch (error) {
      console.error('Error deleting part:', error)
      toast.error('Failed to delete reference')
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

  return (
    <Main>
      <div className="flex flex-col space-y-6 p-4 md:p-8 pt-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="relative flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('references.title')}</h1>
              </div>
              <p className="text-amber-100 text-sm sm:text-base ml-0 sm:ml-14">
                {t('references.subtitle')}
              </p>
            </div>
            <Button onClick={handleAdd} className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-4 w-4" /> {t('references.addReference')}
            </Button>
          </div>
        </div>

        {/* Enhanced Search Card */}
        <div className="rounded-2xl border-2 bg-gradient-to-br from-white to-gray-50/50 p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full max-w-md space-y-2">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-orange-600" />
                {t('references.searchReferences')}
              </span>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('references.searchPlaceholder')}
                  className="pl-10 h-11 border-2 focus:ring-4 focus:ring-orange-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={fetchParts}
              className="h-11 border-2 mt-7"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>

        {/* Enhanced Table Card */}
        <div className="rounded-2xl border-2 bg-white shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50">
                <TableRow className="border-b-2 border-orange-200">
                  <TableHead className="w-[180px] font-bold text-gray-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="uppercase text-xs tracking-wider">{t('references.learPN')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px] font-bold text-gray-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="uppercase text-xs tracking-wider">Sarbia PN</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px] font-bold text-gray-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="uppercase text-xs tracking-wider">{t('references.tescaPN')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-gray-800">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      <span className="uppercase text-xs tracking-wider">{t('references.description')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[120px] text-right font-bold text-gray-800">
                    <div className="flex items-center justify-end gap-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="uppercase text-xs tracking-wider">{t('references.qtyPerBox')}</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-[80px] text-right font-bold text-gray-800">
                    <div className="flex items-center justify-end gap-2">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                      <span className="uppercase text-xs tracking-wider">{t('common.actions')}</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col justify-center items-center gap-3 text-muted-foreground">
                        <svg className="h-8 w-8 animate-spin text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="font-medium">{t('references.loadingReferences')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">{t('references.noReferencesFound')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((part, index) => (
                    <TableRow
                      key={part.id}
                      className={`hover:bg-orange-50/50 transition-colors border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                    >
                      <TableCell className="font-mono text-sm font-semibold text-gray-900">{part.learPN}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">{part.sarbiaPN || '-'}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">{part.tescaPN}</TableCell>
                      <TableCell className="text-sm text-gray-600">{part.desc}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold shadow-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                          {part.qtyPerBox || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-700 transition-colors">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(part)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setPartToDelete(part)}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border-2 shadow-lg">
          <div className="text-sm text-gray-600 font-medium">
            {t('common.showing')} <span className="font-bold text-gray-900">{data.length}</span> {t('common.of')} <span className="font-bold text-gray-900">{totalItems}</span> {t('common.entries')}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="h-9 border-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="h-9 border-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.previous')}
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Button
                    key={i}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className={`h-9 w-9 border-2 ${page === pageNum ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold shadow-lg' : ''
                      }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="h-9 border-2"
            >
              {t('common.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="h-9 border-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>

        <Dialog open={isaddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="hidden">{t('references.referenceForm')}</DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <AddReferenceForm
                initialData={editingPart}
                onSuccess={onFormSuccess}
              />
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!partToDelete} onOpenChange={(open) => !open && setPartToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('common.cannotBeUndone')} {t('references.deleteConfirm')}
                <span className="font-semibold text-foreground"> {partToDelete?.learPN} </span>
                {t('references.andRemove')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Main>
  )
}
