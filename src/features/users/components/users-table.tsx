import { useEffect, useState, useMemo } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { roles, phoneFilterOptions, emailFilterOptions } from '../data/data'
import { type User } from '../data/schema'
import { motion, AnimatePresence } from 'framer-motion'
import { useUsersColumns } from './users-columns'
import { toast } from 'sonner'
import { useUsers } from './users-provider'
import { useTranslation } from 'react-i18next'
import { UsersCards } from './users-cards'
import {
  Users as UsersIcon,
  CreditCard,
  Briefcase,
  Shield,
  PhoneCall,
  PhoneOff,
  MailCheck,
  MailX,
  Filter,
  X,
  Sparkles,
  LayoutList,
  LayoutGrid,
} from 'lucide-react'

type DataTableProps = {
  data?: User[]
  allUsers?: User[]
  search: Record<string, unknown>
  navigate: NavigateFn
  roleFilter?: string
}

export function UsersTable({
  search,
  navigate,
  roleFilter,
  allUsers = [],
}: DataTableProps) {
  const { t } = useTranslation()
  const columns = useUsersColumns()
  const { setRefreshCallback } = useUsers()

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // Server-backed data
  const [rows, setRows] = useState<User[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [serverPageCount, setServerPageCount] = useState<number>(1)
  const [totalRows, setTotalRows] = useState<number>(0)

  // View mode: 'table' or 'cards' (persisted in localStorage)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('users_view_mode')
      if (saved === 'cards' || saved === 'table') return saved
    }
    return 'table'
  })

  const handleViewModeChange = (mode: 'table' | 'cards') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('users_view_mode', mode)
    }
  }

  // URL State management
  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: false },
    columnFilters: [
      { columnId: 'matricule', searchKey: 'username', type: 'string' },
      { columnId: 'role', searchKey: 'role', type: 'array' },
      { columnId: 'phone', searchKey: 'phone', type: 'array' },
      { columnId: 'email', searchKey: 'email', type: 'array' },
    ],
  })

  async function fetchUsers() {
    try {
      setIsFetching(true)
      const params = new URLSearchParams()
      if (search.username) params.set('search', search.username as string)

      const roleParam =
        roleFilter ||
        (Array.isArray(search.role) && search.role.length
          ? (search.role as string[]).join(',')
          : '')
      if (roleParam) params.set('role', roleParam)

      if (Array.isArray(search.phone) && search.phone.length) {
        params.set('hasPhone', (search.phone as string[])[0])
      }

      if (Array.isArray(search.email) && search.email.length) {
        params.set('hasEmail', (search.email as string[])[0])
      }

      const currentPage = Number(search.page) || 1
      const currentSize = Number(search.pageSize) || 10
      params.set('page', String(currentPage))
      params.set('size', String(currentSize))

      const res = await fetch(`/api/users/search?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.message || t('users.searchFailed') || 'Erreur de recherche')
        return
      }
      const json = await res.json()
      const list = Array.isArray(json?.users) ? json.users : []
      const totalItems = typeof json?.totalItems === 'number' ? json.totalItems : list.length
      const calculatedPages =
        typeof json?.totalPages === 'number' && json.totalPages > 0
          ? json.totalPages
          : Math.max(1, Math.ceil(totalItems / currentSize))

      setServerPageCount(calculatedPages)
      setTotalRows(totalItems)

      setRows(
        list.map((u: any) => ({
          id: String(u.id),
          matricule: u.matricule ?? '',
          email: u.email ?? '',
          phone: u.phone ?? '',
          role: u.role,
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
          password: u.password,
        })) as User[]
      )
    } catch {
      toast.error(t('users.serverError') || 'Erreur de chargement')
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    setRefreshCallback(fetchUsers)
  }, [
    search.username,
    search.role,
    search.phone,
    search.email,
    search.page,
    search.pageSize,
    roleFilter,
    setRefreshCallback,
  ])

  useEffect(() => {
    fetchUsers()
  }, [
    search.username,
    search.role,
    search.phone,
    search.email,
    search.page,
    search.pageSize,
    roleFilter,
  ])

  const table = useReactTable({
    data: rows,
    columns,
    pageCount: serverPageCount,
    rowCount: totalRows,
    manualPagination: true,
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
    },
    onPaginationChange,
    onColumnFiltersChange,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    if (serverPageCount > 1) {
      ensurePageInRange(serverPageCount)
    }
  }, [serverPageCount, ensurePageInRange])

  // Count calculations for quick filter pills
  const counts = useMemo(() => {
    const list = allUsers.length > 0 ? allUsers : rows
    return {
      all: list.length,
      operateur: list.filter((u) => (u.role || '').toLowerCase() === 'operateur').length,
      superviseur: list.filter((u) => (u.role || '').toLowerCase() === 'superviseur').length,
      admin: list.filter(
        (u) =>
          (u.role || '').toLowerCase() === 'admin' ||
          (u.role || '').toLowerCase() === 'superadmin'
      ).length,
      withPhone: list.filter((u) => u.phone && u.phone.trim() !== '' && u.phone.trim() !== '-').length,
      withoutPhone: list.filter(
        (u) => !u.phone || u.phone.trim() === '' || u.phone.trim() === '-'
      ).length,
      withEmail: list.filter((u) => u.email && u.email.trim() !== '' && u.email.trim() !== '-').length,
      withoutEmail: list.filter(
        (u) => !u.email || u.email.trim() === '' || u.email.trim() === '-'
      ).length,
    }
  }, [allUsers, rows])

  // Active filters detection
  const activeRoleFilters = (table.getColumn('role')?.getFilterValue() as string[]) || []
  const activePhoneFilters = (table.getColumn('phone')?.getFilterValue() as string[]) || []
  const activeEmailFilters = (table.getColumn('email')?.getFilterValue() as string[]) || []
  const hasActiveFilters =
    activeRoleFilters.length > 0 ||
    activePhoneFilters.length > 0 ||
    activeEmailFilters.length > 0 ||
    Boolean(table.getColumn('matricule')?.getFilterValue())

  const quickFilterPills = [
    {
      id: 'all',
      label: 'Tous',
      count: counts.all,
      icon: UsersIcon,
      isActive:
        activeRoleFilters.length === 0 &&
        activePhoneFilters.length === 0 &&
        activeEmailFilters.length === 0,
      activeClass:
        'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 border-violet-400',
      badgeClass: 'bg-white/25 text-white',
      onClick: () => {
        table.resetColumnFilters()
      },
    },
    {
      id: 'operateur',
      label: 'Opérateurs',
      count: counts.operateur,
      icon: CreditCard,
      isActive: activeRoleFilters.includes('operateur') && activeRoleFilters.length === 1,
      activeClass:
        'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 border-blue-400',
      badgeClass: 'bg-blue-400/30 text-white',
      onClick: () => {
        table.getColumn('role')?.setFilterValue(['operateur'])
      },
    },
    {
      id: 'superviseur',
      label: 'Superviseurs',
      count: counts.superviseur,
      icon: Briefcase,
      isActive: activeRoleFilters.includes('superviseur') && activeRoleFilters.length === 1,
      activeClass:
        'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30 border-purple-400',
      badgeClass: 'bg-purple-400/30 text-white',
      onClick: () => {
        table.getColumn('role')?.setFilterValue(['superviseur'])
      },
    },
    {
      id: 'admin',
      label: 'Admins',
      count: counts.admin,
      icon: Shield,
      isActive: activeRoleFilters.includes('admin') && activeRoleFilters.length === 1,
      activeClass:
        'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-500/30 border-rose-400',
      badgeClass: 'bg-rose-400/30 text-white',
      onClick: () => {
        table.getColumn('role')?.setFilterValue(['admin'])
      },
    },
    {
      id: 'withPhone',
      label: 'Avec Tél',
      count: counts.withPhone,
      icon: PhoneCall,
      isActive: activePhoneFilters.includes('hasPhone'),
      activeClass:
        'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 border-emerald-400',
      badgeClass: 'bg-emerald-400/30 text-white',
      onClick: () => {
        table.getColumn('phone')?.setFilterValue(['hasPhone'])
      },
    },
    {
      id: 'withoutPhone',
      label: 'Sans Tél',
      count: counts.withoutPhone,
      icon: PhoneOff,
      isActive: activePhoneFilters.includes('noPhone'),
      activeClass:
        'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/30 border-amber-400',
      badgeClass: 'bg-amber-400/30 text-white',
      onClick: () => {
        table.getColumn('phone')?.setFilterValue(['noPhone'])
      },
    },
    {
      id: 'withEmail',
      label: 'Avec Email',
      count: counts.withEmail,
      icon: MailCheck,
      isActive: activeEmailFilters.includes('hasEmail'),
      activeClass:
        'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg shadow-sky-500/30 border-sky-400',
      badgeClass: 'bg-sky-400/30 text-white',
      onClick: () => {
        table.getColumn('email')?.setFilterValue(['hasEmail'])
      },
    },
    {
      id: 'withoutEmail',
      label: 'Sans Email',
      count: counts.withoutEmail,
      icon: MailX,
      isActive: activeEmailFilters.includes('noEmail'),
      activeClass:
        'bg-gradient-to-r from-slate-600 to-gray-700 text-white shadow-lg shadow-slate-500/30 border-slate-400',
      badgeClass: 'bg-slate-400/30 text-white',
      onClick: () => {
        table.getColumn('email')?.setFilterValue(['noEmail'])
      },
    },
  ]

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16',
        'flex flex-1 flex-col gap-5'
      )}
    >
      {/* ── Quick Filter Pills Bar ── */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-[rgba(16,12,44,0.75)] p-3.5 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
            <Filter className="h-4 w-4 text-violet-400" />
            <span>Filtres Rapides par Catégorie & Contact</span>
          </div>

          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                table.resetColumnFilters()
                table.setGlobalFilter('')
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Réinitialiser les filtres</span>
            </motion.button>
          )}
        </div>

        {/* Scrollable Pills container */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-violet-500/30">
          {quickFilterPills.map((pill) => {
            const Icon = pill.icon
            return (
              <motion.button
                key={pill.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={pill.onClick}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap border',
                  pill.isActive
                    ? pill.activeClass
                    : 'bg-white/5 border-violet-500/20 text-slate-300 hover:bg-white/10 hover:text-white hover:border-violet-500/40'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{pill.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded-md text-[11px] font-bold font-mono',
                    pill.isActive ? pill.badgeClass : 'bg-white/10 text-slate-300'
                  )}
                >
                  {pill.count}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── Toolbar with Faceted Dropdown Filters & View Switcher ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1">
          <DataTableToolbar
            table={table}
            searchPlaceholder={t('users.searchPlaceholder') || 'Filtrer par matricule, nom, email, tél...'}
            searchKey="matricule"
            filters={[
              {
                columnId: 'role',
                title: t('users.role') || 'Rôle',
                options: roles.map((role) => ({ ...role })),
              },
              {
                columnId: 'phone',
                title: t('users.phoneNumber') || 'Téléphone',
                options: phoneFilterOptions.map((opt) => ({ ...opt })),
              },
              {
                columnId: 'email',
                title: t('users.email') || 'Email',
                options: emailFilterOptions.map((opt) => ({ ...opt })),
              },
            ]}
          />
        </div>

        {/* View Mode Toggle: Tableau vs Cartes */}
        <div className="flex items-center self-end md:self-auto gap-1 rounded-2xl border border-violet-500/25 bg-[rgba(18,14,46,0.85)] p-1 backdrop-blur-xl shadow-lg shrink-0">
          <button
            type="button"
            onClick={() => handleViewModeChange('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer',
              viewMode === 'table'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 border border-violet-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
            title="Affichage en Tableau"
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span>Tableau</span>
          </button>

          <button
            type="button"
            onClick={() => handleViewModeChange('cards')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer',
              viewMode === 'cards'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 border border-violet-400/40'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
            title="Affichage en Cartes"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cartes</span>
          </button>
        </div>
      </div>

      {/* ── Active Filter Summary Chips ── */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-2 px-2 text-xs"
          >
            <span className="text-violet-300/80 font-medium flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              Filtres appliqués :
            </span>

            {activeRoleFilters.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-200 capitalize font-medium"
              >
                Rôle: {r}
                <button
                  onClick={() => {
                    const next = activeRoleFilters.filter((item) => item !== r)
                    table.getColumn('role')?.setFilterValue(next.length ? next : undefined)
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {activePhoneFilters.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-medium"
              >
                {p === 'hasPhone' ? 'Avec Téléphone' : 'Sans Téléphone'}
                <button
                  onClick={() => {
                    const next = activePhoneFilters.filter((item) => item !== p)
                    table.getColumn('phone')?.setFilterValue(next.length ? next : undefined)
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {activeEmailFilters.map((e) => (
              <span
                key={e}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600/30 border border-sky-500/40 text-sky-200 font-medium"
              >
                {e === 'hasEmail' ? 'Avec Email' : 'Sans Email'}
                <button
                  onClick={() => {
                    const next = activeEmailFilters.filter((item) => item !== e)
                    table.getColumn('email')?.setFilterValue(next.length ? next : undefined)
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            <button
              onClick={() => table.resetColumnFilters()}
              className="text-slate-400 hover:text-white underline underline-offset-2 ml-1 cursor-pointer"
            >
              Tout effacer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Display: Table or Cards ── */}
      {viewMode === 'table' ? (
        <motion.div
          key="table-view"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-violet-500/25 bg-[rgba(15,11,38,0.85)] shadow-2xl shadow-purple-950/30 backdrop-blur-2xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-violet-500/25 bg-gradient-to-r from-violet-950/60 via-purple-950/40 to-slate-950/60">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          colSpan={header.colSpan}
                          className={cn(
                            'py-4 px-5 text-xs font-bold uppercase tracking-wider text-violet-300',
                            header.column.columnDef.meta?.className,
                            header.column.columnDef.meta?.thClassName
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="divide-y divide-violet-500/10">
                {isFetching ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-20 text-center">
                      <div className="flex flex-col justify-center items-center gap-3 text-muted-foreground">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 shadow-inner">
                          <svg
                            className="h-6 w-6 animate-spin"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        </div>
                        <span className="font-semibold text-slate-300">
                          {t('users.loadingUsers') || 'Chargement des utilisateurs...'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(
                        'transition-colors duration-150 border-b border-violet-500/10',
                        index % 2 === 0
                          ? 'bg-[rgba(20,16,50,0.4)] hover:bg-violet-600/15'
                          : 'bg-transparent hover:bg-violet-600/15'
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'py-3.5 px-5 text-slate-200',
                            cell.column.columnDef.meta?.className,
                            cell.column.columnDef.meta?.tdClassName
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="py-20 text-center"
                    >
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
                          <svg
                            className="w-8 h-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                        </div>
                        <span className="font-bold text-slate-300 text-base">
                          {t('users.noUsersFound') || 'Aucun utilisateur trouvé'}
                        </span>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Essayez de modifier ou de réinitialiser vos critères de recherche et vos filtres.
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={() => table.resetColumnFilters()}
                            className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="cards-view"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <UsersCards
            users={rows}
            isFetching={isFetching}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={() => table.resetColumnFilters()}
          />
        </motion.div>
      )}
      <DataTablePagination table={table} className="mt-auto" />
    </div>
  )
}
