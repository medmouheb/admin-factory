import { useEffect, useState } from 'react'
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
import { roles } from '../data/data'
import { type User } from '../data/schema'

import { usersColumns as columns } from './users-columns'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useUsers } from './users-provider'

type DataTableProps = {
  data: User[]
  search: Record<string, unknown>
  navigate: NavigateFn
  roleFilter?: string
}

export function UsersTable({ data, search, navigate, roleFilter }: DataTableProps) {
  // Local UI-only states
  const { setRefreshCallback } = useUsers()

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // Server-backed data
  const [rows, setRows] = useState<User[]>([])
  const [isFetching, setIsFetching] = useState(false)

  async function fetchUsers() {
    try {
      setIsFetching(true)
      const params = new URLSearchParams()
      if (search.username) params.set('username', search.username as string)

      // Use roleFilter if provided (for superviseur), otherwise use search.role
      const roleParam = roleFilter || (Array.isArray(search.role) && search.role.length ? (search.role as string[])[0] : '')
      if (roleParam) params.set('role', roleParam)

      params.set('page', String((search.page ?? 1)))
      params.set('size', String((search.pageSize ?? 10)))
      const res = await fetch(`http://localhost:8080/api/users/search?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        toast.error(err?.message || 'Search failed')
        return
      }
      const json = await res.json()
      const list = Array.isArray(json?.users) ? json.users : []
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
    } catch (e) {
      toast.error('Server error')
    } finally {
      setIsFetching(false)
    }
  }

  // Register fetchUsers with the context
  useEffect(() => {
    setRefreshCallback(fetchUsers)
  }, [search.username, search.role, search.page, search.pageSize, roleFilter, setRefreshCallback])

  useEffect(() => {
    fetchUsers()
  }, [search.username, search.role, search.page, search.pageSize, roleFilter])

  // Local state management for table (uncomment to use local-only state, not synced with URL)
  // const [columnFilters, onColumnFiltersChange] = useState<ColumnFiltersState>([])
  // const [pagination, onPaginationChange] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  // Synced with URL states (keys/defaults mirror users route search schema)
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
      // username per-column text filter
      { columnId: 'username', searchKey: 'username', type: 'string' },
      { columnId: 'role', searchKey: 'role', type: 'array' },
    ],
  })

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns,
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
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return (
    <div
      className={cn(
        'max-sm:has-[div[role="toolbar"]]:mb-16', // Add margin bottom to the table on mobile when the toolbar is visible
        'flex flex-1 flex-col gap-4'
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder='Search by username, matricule, or name...'
        searchKey='matricule'
        filters={[
          {
            columnId: 'role',
            title: 'Role',
            options: roles.map((role) => ({ ...role })),
          },
        ]}
      />
      <div className="rounded-2xl border-2 bg-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="group/row border-b-2 border-violet-200">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={cn(
                          'font-bold text-gray-800',
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
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col justify-center items-center gap-3 text-muted-foreground">
                      <svg className="h-8 w-8 animate-spin text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="font-medium">Loading users...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn(
                      'group/row hover:bg-violet-50/50 transition-colors border-b',
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
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
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-medium">No users found matching criteria.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
