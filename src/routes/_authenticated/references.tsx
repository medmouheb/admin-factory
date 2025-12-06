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

export const Route = createFileRoute('/_authenticated/references')({
  component: ReferencesPage,
})

interface Part {
  id: number
  learPN: string
  tescaPN: string
  desc: string
  qtyPerBox?: number
  createdAt: string
  updatedAt: string
}

function ReferencesPage() {
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
      <div className='flex flex-col space-y-6 p-4 md:p-8 pt-6'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>References</h1>
            <p className='text-muted-foreground mt-2'>
              Manage your parts catalogue, including Lear and Tesca part numbers.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button onClick={handleAdd} className="shadow-lg hover:shadow-xl transition-all">
              <Plus className='mr-2 h-4 w-4' /> Add Reference
            </Button>
          </div>
        </div>

        <div className='flex items-center justify-between gap-4 bg-background p-4 rounded-lg border shadow-sm'>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search references..."
              className="pl-9 bg-muted/50 focus:bg-background transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchParts} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Lear PN</TableHead>
                <TableHead>Tesca PN</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty/Box</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading data...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((part) => (
                  <TableRow key={part.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{part.learPN}</TableCell>
                    <TableCell>{part.tescaPN}</TableCell>
                    <TableCell>{part.desc}</TableCell>
                    <TableCell className="text-right">{part.qtyPerBox || '-'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(part)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPartToDelete(part)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
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

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {data.length} of {totalItems} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Dialog open={isaddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="hidden">Reference Form</DialogTitle>
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
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the reference
                <span className="font-semibold text-foreground"> {partToDelete?.learPN} </span>
                and remove it from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Main>
  )
}
