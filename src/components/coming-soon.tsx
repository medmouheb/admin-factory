
import { useCallback, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  Barcode,
  Ticket,
  Search,
  Filter,
  Plus,
  Download,
  RefreshCw,
  MoreVertical,
  Calendar,
  FileText,
  Trash2,
  Edit,
  Printer,
  X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { useAuthStore } from "@/stores/auth-store"
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

type TicketCode = {
  id: string
  code: string
  matricule: string
  createdAt: string
  totalTickets?: number
  learPN?: string
  quantity?: number
  hu?: string
}

type Ticket = {
  id: string
  barcode: string
  learPN: string
  matricule?: string
  createdAt: string
  hu?: string
  ticketCode?: string
}

export function ComingSoon() {
  const { t } = useTranslation()
  const [data, setData] = useState<TicketCode[]>([])
  const [selectedOne, setSelectedOne] = useState<TicketCode>()

  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [date, setDate] = useState("") // single date param for backend
  const [hu, setHu] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [minTickets, setMinTickets] = useState("")
  const [maxTickets, setMaxTickets] = useState("")
  const [timePreset, setTimePreset] = useState<"all" | "24h" | "7d" | "30d">(
    "all",
  )

  // Popup states
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedCode, setSelectedCode] = useState("")
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketLoading, setTicketLoading] = useState(false)
  const [ticketSearch, setTicketSearch] = useState("")
  const [ticketStartDate, setTicketStartDate] = useState("")
  const [ticketEndDate, setTicketEndDate] = useState("")
  const [ticketSort, setTicketSort] = useState<"recent" | "oldest">("recent")
  const [ticketDisplayPage, setTicketDisplayPage] = useState(1)
  const ticketsPerPage = 10

  // CRUD states
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [ticketForm, setTicketForm] = useState({
    barcode: "",
    ticketCode: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ticket Code CRUD states
  const [openEditTicketCodeDialog, setOpenEditTicketCodeDialog] = useState(false)
  const [openDeleteTicketCodeDialog, setOpenDeleteTicketCodeDialog] = useState(false)
  const [selectedTicketCode, setSelectedTicketCode] = useState<TicketCode | null>(null)
  const [ticketCodeForm, setTicketCodeForm] = useState({
    learPN: "",
    quantity: "",
    hu: "",
  })

  // Get Ticket by Barcode states
  const [openBarcodeSearchDialog, setOpenBarcodeSearchDialog] = useState(false)
  const [barcodeSearchInput, setBarcodeSearchInput] = useState("")
  const [barcodeSearchResult, setBarcodeSearchResult] = useState<Ticket | null>(null)
  const [barcodeSearchLoading, setBarcodeSearchLoading] = useState(false)

  const navigate = useNavigate()

  // ---------------------
  // Fetch Ticket Codes
  // ---------------------
  const fetchTicketCodes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
        sort: sortOrder,
      })

      if (hu) params.append("hu", hu)
      if (date) params.append("date", date)
      if (timePreset && timePreset !== "all") params.append("time", timePreset)


      const res = await fetch(
        `http://localhost:8080/api/ticketscode/ticket-code?${params.toString()}`, {
        credentials: 'include',   // ⬅️ VERY IMPORTANT

      }
      )
      const json = await res.json()

      setData(json.data || [])
      setTotalPages(json.totalPages || 1)
    } catch (err) {
      console.error("Error fetching ticket codes:", err)
    }
    setLoading(false)
  }, [page, limit, searchQuery, sortOrder, hu, date, timePreset])

  useEffect(() => {
    fetchTicketCodes()
  }, [fetchTicketCodes])

  // ---------------------
  // Fetch Tickets by ticketCode (popup)
  // ---------------------
  const fetchTicketsByCode = async (code: string) => {
    setTicketLoading(true)
    try {
      // First, try to fetch with a reasonable limit
      const res = await fetch(
        `http://localhost:8080/api/tickets/search?page=1&limit=100&search=${encodeURIComponent(code)}`,
        { credentials: 'include' }
      )

      if (!res.ok) {
        let errorMessage = `Server error: ${res.status}`
        try {
          const errorText = await res.text()
          if (errorText) {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.message || errorJson.error || errorMessage
          }
        } catch {
          // If parsing fails, use the default message
        }
        console.error("API Error:", res.status, errorMessage)
        throw new Error(errorMessage)
      }

      const json = await res.json()
      const ticketsData = json.data || []

      // If we got tickets and there might be more pages, fetch them
      if (ticketsData.length > 0 && json.totalPages > 1) {
        const totalPages = json.totalPages
        let allTickets = [...ticketsData]

        // Fetch remaining pages (limit to avoid too many requests)
        for (let page = 2; page <= Math.min(totalPages, 10); page++) {
          try {
            const nextRes = await fetch(
              `http://localhost:8080/api/tickets/search?page=${page}&limit=100&search=${encodeURIComponent(code)}`,
              { credentials: 'include' }
            )
            if (nextRes.ok) {
              const nextJson = await nextRes.json()
              allTickets = [...allTickets, ...(nextJson.data || [])]
            }
          } catch {
            // If a page fails, just stop fetching more
            break
          }
        }

        setTickets(allTickets)
        if (allTickets.length > 0) {
          toast.success(t('ticketManagement.loadedTickets', { count: allTickets.length }))
        }
      } else {
        setTickets(ticketsData)
        if (ticketsData.length > 0) {
          toast.success(t('ticketManagement.loadedTickets', { count: ticketsData.length }))
        } else {
          toast.info(t('ticketManagement.noTicketsFoundForCode'))
        }
      }
    } catch (err) {
      console.error("Error fetching tickets:", err)
      setTickets([])
      const errorMessage = err instanceof Error ? err.message : t('ticketManagement.failedToLoadTickets')
      toast.error(errorMessage)
    } finally {
      setTicketLoading(false)
    }
  }

  const formatDate = useCallback((value: string) => {
    if (!value) return "—"
    const date = new Date(value)
    return date.toLocaleString()
  }, [])

  // ---------------------
  // CRUD Operations
  // ---------------------
  const handleCreateTicket = async () => {
    if (!ticketForm.barcode || !ticketForm.ticketCode) {
      toast.error(t('ticketManagement.pleaseFillAllFields'))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("http://localhost:8080/api/tickets", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: ticketForm.barcode,
          ticketCode: ticketForm.ticketCode,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || t('ticketManagement.failedToCreateTicket'))
      }

      toast.success(t('ticketManagement.ticketCreatedSuccess'))
      setOpenCreateDialog(false)
      setTicketForm({ barcode: "", ticketCode: "" })
      // Refresh tickets
      if (selectedCode) {
        await fetchTicketsByCode(selectedCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('ticketManagement.failedToCreateTicket')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket || !ticketForm.barcode) {
      toast.error(t('ticketManagement.pleaseFillAllFields'))
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8080/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: ticketForm.barcode,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || t('ticketManagement.failedToUpdateTicket'))
      }

      toast.success(t('ticketManagement.ticketUpdatedSuccess'))
      setOpenEditDialog(false)
      setSelectedTicket(null)
      setTicketForm({ barcode: "", ticketCode: "" })
      // Refresh tickets
      if (selectedCode) {
        await fetchTicketsByCode(selectedCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('ticketManagement.failedToUpdateTicket')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8080/api/tickets/${selectedTicket.id}`, {
        method: "DELETE",
        credentials: 'include',
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || t('ticketManagement.failedToDeleteTicket'))
      }

      toast.success(t('ticketManagement.ticketDeletedSuccess'))
      setOpenDeleteDialog(false)
      setSelectedTicket(null)
      // Refresh tickets
      if (selectedCode) {
        await fetchTicketsByCode(selectedCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('ticketManagement.failedToDeleteTicket')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------
  // Ticket Code CRUD Operations
  // ---------------------
  const handleUpdateTicketCode = async () => {
    if (!selectedTicketCode) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8080/api/ticketscode/${selectedTicketCode.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          learPN: ticketCodeForm.learPN,
          quantity: Number(ticketCodeForm.quantity),
          hu: ticketCodeForm.hu,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || t('ticketManagement.failedToUpdateTicketCode'))
      }

      toast.success(t('ticketManagement.ticketCodeUpdatedSuccess'))
      setOpenEditTicketCodeDialog(false)
      setSelectedTicketCode(null)
      setTicketCodeForm({ learPN: "", quantity: "", hu: "" })
      await fetchTicketCodes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('ticketManagement.failedToUpdateTicketCode')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTicketCode = async () => {
    if (!selectedTicketCode) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8080/api/ticketscode/${selectedTicketCode.id}`, {
        method: "DELETE",
        credentials: 'include'
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || t('ticketManagement.failedToDeleteTicketCode'))
      }

      toast.success(t('ticketManagement.ticketCodeDeletedSuccess'))
      setOpenDeleteTicketCodeDialog(false)
      setSelectedTicketCode(null)
      await fetchTicketCodes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('ticketManagement.failedToDeleteTicketCode')
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------
  // Get Ticket by Barcode
  // ---------------------
  const handleSearchByBarcode = async () => {
    if (!barcodeSearchInput.trim()) {
      toast.error(t('ticketManagement.pleaseEnterBarcode'))
      return
    }

    setBarcodeSearchLoading(true)
    try {
      const res = await fetch(`http://localhost:8080/api/tickets/barcode/${encodeURIComponent(barcodeSearchInput)}`, { credentials: 'include' })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Ticket not found")
      }

      const data = await res.json()
      setBarcodeSearchResult(data)
      toast.success(t('ticketManagement.ticketFoundSuccess'))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('ticketManagement.failedToFindTicket')
      toast.error(errorMessage)
      setBarcodeSearchResult(null)
    } finally {
      setBarcodeSearchLoading(false)
    }
  }
  const { auth } = useAuthStore()

  const generateTicketPDF = (ticketCode: string) => {
    console.log(selectedOne)
    const doc = new jsPDF({ unit: 'cm', format: [5, 5] });
    const m = 0.2
    const w = 4.6
    const h = 4.6

    doc.setLineWidth(0.02)
    doc.setDrawColor(0)

    // Border & Grid
    doc.rect(m, m, w, h)
    doc.line(m, 0.9, m + w, 0.9)
    doc.line(m, 1.5, m + w, 1.5)
    doc.line(m, 3.9, m + w, 3.9)

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TESCA', m + 0.2, 0.7)
    doc.text('SK', m + w - 0.2, 0.7, { align: 'right' })

    // Ref (LearPN)
    const ref = selectedOne?.learPN || ""
    doc.setFontSize(11)
    doc.text(ref, 2.5, 1.35, { align: 'center' })

    // Barcode
    const canvas1 = document.createElement('canvas');
    if (selectedOne?.code) {
      JsBarcode(canvas1, selectedOne?.code, {
        format: 'CODE128',
        width: 4,
        height: 80,
        displayValue: false,
        margin: 0
      });
      doc.addImage(canvas1.toDataURL('image/png'), 'PNG', m + 0.1, 1.6, w - 0.2, 1.8);
    }

    // Ticket Code Text
    doc.setFontSize(10)
    doc.text(selectedOne?.code || '', 2.5, 3.75, { align: 'center' })

    // Footer
    doc.setFontSize(9)
    doc.text(`Op: ${selectedOne?.matricule || ''}`, m + 0.1, 4.3)
    const qty = selectedOne?.quantity || '' // Use selectedTicketCode quantity
    doc.text(`Qty: ${qty}`, m + w - 0.1, 4.3, { align: 'right' })

    // Date
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const now = new Date(selectedOne?.createdAt || '')
    doc.text(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), 2.5, 4.7, { align: 'center' })

    // Print
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 10000);
      }, 100);
    };
  };

  const openEditDialogForTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setTicketForm({
      barcode: ticket.barcode,
      ticketCode: selectedCode,
    })
    setOpenEditDialog(true)
  }

  const openDeleteDialogForTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setOpenDeleteDialog(true)
  }

  const openCreateDialogForCode = () => {
    setTicketForm({
      barcode: "",
      ticketCode: selectedCode,
    })
    setOpenCreateDialog(true)
  }

  const openEditDialogForTicketCode = (ticketCode: TicketCode) => {
    setSelectedTicketCode(ticketCode)
    setTicketCodeForm({
      learPN: ticketCode.learPN || "",
      quantity: String(ticketCode.quantity || ""),
      hu: ticketCode.hu || "",
    })
    setOpenEditTicketCodeDialog(true)
  }

  const openDeleteDialogForTicketCode = (ticketCode: TicketCode) => {
    setSelectedTicketCode(ticketCode)
    setOpenDeleteTicketCodeDialog(true)
  }

  // Open popup
  const handleOpenTickets = (code: string) => {
    setSelectedCode(code)
    setOpenDialog(true)
    setTicketDisplayPage(1)
    setTicketSearch("")
    setTicketStartDate("")
    setTicketEndDate("")
    setTicketSort("recent")
    fetchTicketsByCode(code)
  }

  const resetTicketFilters = () => {
    setTicketSearch("")
    setTicketStartDate("")
    setTicketEndDate("")
    setTicketSort("recent")
    setTicketDisplayPage(1)
  }

  const filteredTickets = useMemo(() => {
    const matches = tickets.filter((ticket) => {
      const searchMatch =
        ticketSearch.trim().length === 0 ||
        ticket.barcode.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        (ticket.hu && ticket.hu.toLowerCase().includes(ticketSearch.toLowerCase()))

      if (!searchMatch) return false

      const createdTime = new Date(ticket.createdAt).getTime()
      if (ticketStartDate) {
        const start = new Date(ticketStartDate).setHours(0, 0, 0, 0)
        if (createdTime < start) return false
      }
      if (ticketEndDate) {
        const end = new Date(ticketEndDate).setHours(23, 59, 59, 999)
        if (createdTime > end) return false
      }
      return true
    })

    return matches.sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return ticketSort === "recent" ? diff * -1 : diff
    })
  }, [tickets, ticketSearch, ticketStartDate, ticketEndDate, ticketSort])

  const paginatedTickets = useMemo(() => {
    const start = (ticketDisplayPage - 1) * ticketsPerPage
    const end = start + ticketsPerPage
    return filteredTickets.slice(start, end)
  }, [filteredTickets, ticketDisplayPage])

  const ticketTotalPages = Math.ceil(filteredTickets.length / ticketsPerPage)

  // Reset page when filters change
  useEffect(() => {
    setTicketDisplayPage(1)
  }, [ticketSearch, ticketStartDate, ticketEndDate, ticketSort])

  const ticketFiltersCount = useMemo(() => {
    let count = 0
    if (ticketSearch) count += 1
    if (ticketStartDate) count += 1
    if (ticketEndDate) count += 1
    if (ticketSort === "oldest") count += 1
    return count
  }, [ticketSearch, ticketStartDate, ticketEndDate, ticketSort])

  // ---------------------
  // Main Pagination
  // ---------------------
  const nextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }
  const prevPage = () => {
    if (page > 1) setPage(page - 1)
  }

  const handleSearch = () => {
    setPage(1)
    setSearchQuery(searchInput.trim())
  }

  const resetFilters = () => {
    setDate("")
    setHu("")
    setSortOrder("desc")
    setSearchInput("")
    setSearchQuery("")
    setMinTickets("")
    setMaxTickets("")
    setTimePreset("all")
    setPage(1)
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (searchQuery) count += 1
    if (date) count += 1
    if (sortOrder === "asc") count += 1
    if (minTickets) count += 1
    if (maxTickets) count += 1
    if (timePreset !== "all") count += 1
    if (hu) count += 1
    return count
  }, [searchQuery, date, sortOrder, minTickets, maxTickets, timePreset, hu])

  const filteredData = useMemo(() => {
    const min = Number(minTickets)
    const max = Number(maxTickets)

    return data.filter((item) => {
      const total = Number(item.totalTickets ?? 0)
      if (minTickets && !Number.isNaN(min) && total < min) return false
      if (maxTickets && !Number.isNaN(max) && total > max) return false
      return true
    })
  }, [data, minTickets, maxTickets])

  const handlePresetChange = (value: "all" | "24h" | "7d" | "30d") => {
    setTimePreset(value)
    if (value === "all") {
      setDate("")
      return
    }

    // We only set the timePreset for backend; leave `date` for explicit date filtering
    setPage(1)
  }

  const ticketBadgeVariant = (qty?: number) => {
    if (!qty || qty <= 0) return "outline"
    if (qty >= 50) return "default"
    if (qty >= 20) return "secondary"
    return "destructive"
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header Section */}
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
              <Ticket className="h-10 w-10 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mb-2"
              >
                {t('ticketManagement.title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-lg"
              >
                {t('ticketManagement.subtitle')}
              </motion.p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate({ to: '/reapirage' })}
              className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Plus className="mr-2 h-4 w-4" /> {t('ticketManagement.newTicket')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpenBarcodeSearchDialog(true)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all duration-200 hover:scale-105"
            >
              <Search className="mr-2 h-4 w-4" /> {t('ticketManagement.scanBarcode')}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Search & Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid gap-6"
      >
        <Card className="shadow-md bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg font-bold text-foreground">{t('ticketManagement.filtersAndSearch')}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 text-muted-foreground hover:text-foreground"
                >
                  {t('ticketManagement.resetFilters')} ({activeFiltersCount})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchTicketCodes()}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">{t('ticketManagement.ticketCode')}</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('ticketManagement.searchTicketCode')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hu">{t('ticketManagement.huNumber')}</Label>
                <Input
                  id="hu"
                  placeholder={t('ticketManagement.filterByHu')}
                  value={hu}
                  onChange={(e) => {
                    setHu(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('ticketManagement.date')}</Label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value)
                      setPage(1)
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('ticketManagement.sortOrder')}</Label>
                <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => {
                  setSortOrder(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('ticketManagement.sortByDate')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">{t('ticketManagement.newestFirst')}</SelectItem>
                    <SelectItem value="asc">{t('ticketManagement.oldestFirst')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="shadow-lg border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-purple-50/50">
                <TableRow>
                  <TableHead className="w-40 text-xs font-bold uppercase tracking-wider text-purple-900">
                    {t('ticketManagement.ticketCode')}
                  </TableHead>
                  <TableHead className="w-40 text-xs font-bold uppercase tracking-wider text-purple-900">
                    {t('ticketManagement.operateur')}
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    {t('ticketManagement.learPN')}
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    {t('ticketManagement.quantity')}
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    {t('ticketManagement.hu')}
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    {t('ticketManagement.createdAt')}
                  </TableHead>

                  {auth.user?.role !== 'operateur' && (
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900 text-right w-24">
                      {t('ticketManagement.actions')}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && filteredData.length > 0 && filteredData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="group cursor-pointer hover:bg-purple-50/30 transition-colors duration-200"
                    onClick={() => { setSelectedOne(item); handleOpenTickets(item.code) }}
                  >
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-purple-100 text-xs font-bold text-purple-700 shadow-sm">
                          {((page - 1) * limit) + index + 1}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{item.code}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            ID: {String(item.id).substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono bg-slate-50">
                          {item.matricule}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-medium text-slate-600 bg-slate-100/50 px-2 py-1 rounded">
                        {item.learPN || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.quantity ? (
                        <span className="text-sm font-medium">
                          {item.quantity} {t('ticketManagement.units')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {item.hu || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>

                    {auth.user?.role !== 'operateur' && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>{t('ticketManagement.actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialogForTicketCode(item)
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4 text-orange-500" />
                              {t('ticketManagement.editDetails')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialogForTicketCode(item)
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('ticketManagement.deleteRecord')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

                {!loading && filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className="p-4 rounded-full bg-purple-50 ring-8 ring-purple-50/50">
                          <Search className="h-8 w-8 text-purple-300" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{t('ticketManagement.noTicketsFound')}</h3>
                          <p className="text-muted-foreground max-w-[400px]">
                            {t('ticketManagement.noTicketsFoundDesc')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="mt-2"
                        >
                          {t('ticketManagement.clearAllFilters')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{t('ticketManagement.loadingData')}</h3>
                          <p className="text-muted-foreground">
                            {t('ticketManagement.loadingDataDesc')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="border-t bg-gray-50/50 p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t('ticketManagement.showing')} <span className="font-medium text-foreground">{filteredData.length > 0 ? ((page - 1) * limit) + 1 : 0}</span> {t('ticketManagement.to')} <span className="font-medium text-foreground">{Math.min(page * limit, data.length)}</span> {t('ticketManagement.of')} <span className="font-medium text-foreground">{data.length || 0}</span> {t('ticketManagement.results')}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={page === 1}
                className="shadow-sm bg-white"
              >
                {t('ticketManagement.previous')}
              </Button>
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-medium">{t('ticketManagement.page')} {page} {t('ticketManagement.of')} {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={page === totalPages}
                className="shadow-sm bg-white"
              >
                {t('ticketManagement.next')}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ---------------------- */}
      {/* TICKETS POPUP DIALOG   */}
      {/* ---------------------- */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader className="animate-in slide-in-from-top-4 duration-500 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                  {t('ticketManagement.ticketsFor')}: <span className="font-mono">{selectedCode}</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold">{tickets.length}</span> {t('ticketManagement.totalRecords')} • <span className="font-semibold text-purple-600">{filteredTickets.length}</span> {t('ticketManagement.afterFilters')}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1 animate-in fade-in duration-500 delay-200">
                {ticketFiltersCount} {ticketFiltersCount === 1 ? t('ticketManagement.filter') : t('ticketManagement.filters')} {t('ticketManagement.active')}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 rounded-2xl border border-purple-100 bg-white/60 p-5 shadow-inner backdrop-blur animate-in slide-in-from-bottom-4 duration-500 delay-100 flex-1 overflow-y-auto min-h-0">
            {/* Enhanced Filters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-muted-foreground">{t('ticketManagement.filterTickets')}</Label>
                <div className="flex items-center gap-2">

                  {ticketFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 transition-all duration-200 hover:scale-105"
                      onClick={resetTicketFilters}
                    >
                      {t('ticketManagement.clearAll')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-search" className="text-xs text-muted-foreground">{t('ticketManagement.search')}</Label>
                  <Input
                    id="ticket-search"
                    placeholder={t('ticketManagement.barcodeOrHu')}
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-start" className="text-xs text-muted-foreground">{t('ticketManagement.fromDate')}</Label>
                  <Input
                    id="ticket-start"
                    type="date"
                    value={ticketStartDate}
                    onChange={(e) => setTicketStartDate(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-end" className="text-xs text-muted-foreground">{t('ticketManagement.toDate')}</Label>
                  <Input
                    id="ticket-end"
                    type="date"
                    value={ticketEndDate}
                    onChange={(e) => setTicketEndDate(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-sort" className="text-xs text-muted-foreground">{t('ticketManagement.sortOrder')}</Label>
                  <Select
                    value={ticketSort}
                    onValueChange={(value: "recent" | "oldest") =>
                      setTicketSort(value)
                    }
                  >
                    <SelectTrigger id="ticket-sort" className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md">
                      <SelectValue placeholder={t('ticketManagement.sortByDate')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">{t('ticketManagement.newestFirst')}</SelectItem>
                      <SelectItem value="oldest">{t('ticketManagement.oldestFirst')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="rounded-xl border border-border/50 bg-gradient-to-br from-background via-background/90 to-muted/20 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-muted/60 to-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-1/4 font-semibold text-xs uppercase tracking-wider">{t('ticketManagement.ticketBarcode')}</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">{t('ticketManagement.createdDate')}</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right w-24">{t('ticketManagement.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {ticketLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="p-10 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            </div>
                            <p className="text-sm text-muted-foreground animate-pulse">
                              {t('ticketManagement.loadingTickets')}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedTickets.length > 0 ? (
                      paginatedTickets.map((ticket, index) => (
                        <TableRow
                          key={ticket.id}
                          className={`group transition-all duration-300 hover:bg-primary/10 hover:shadow-md hover:-translate-y-[1px] ${index % 2 === 0 ? "bg-background/50" : "bg-muted/10"} animate-in fade-in slide-in-from-left-4`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <p className="font-mono text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                                {ticket.barcode}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                ID: {String(ticket.id).substring(0, 8)}...
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-foreground">
                                {formatDate(ticket.createdAt)}
                              </div>
                              <div className="text-xs text-muted-foreground/70">
                                {new Date(ticket.createdAt).toLocaleDateString(undefined, { weekday: "short" })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 transition-all duration-200 hover:scale-110"
                                >
                                  <span className="sr-only">{t('ticketManagement.openMenu')}</span>
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                    />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel>{t('ticketManagement.actions')}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openEditDialogForTicket(ticket)}
                                  className="cursor-pointer"
                                >
                                  <svg
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  {t('ticketManagement.editDetails')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialogForTicket(ticket)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <svg
                                    className="mr-2 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  {t('ticketManagement.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="animate-in fade-in duration-300">
                        <TableCell
                          colSpan={5}
                          className="p-10 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-base font-medium">
                              {tickets.length === 0
                                ? t('ticketManagement.noTicketsForBatch')
                                : t('ticketManagement.noTicketsMatchFilters')}
                            </p>
                            {tickets.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetTicketFilters}
                                className="text-xs"
                              >
                                {t('ticketManagement.clearFiltersToSeeAll')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 animate-in fade-in duration-500 delay-300 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setTicketDisplayPage(prev => Math.max(1, prev - 1))}
              disabled={ticketDisplayPage === 1 || ticketLoading}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← {t('ticketManagement.previous')}
            </Button>

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {t('ticketManagement.page')}
              </p>
              <Badge variant="secondary" className="font-semibold">
                {ticketDisplayPage}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {t('ticketManagement.of')} <b>{ticketTotalPages || 1}</b>
              </p>
              {filteredTickets.length > 0 && (
                <p className="text-xs text-muted-foreground/70">
                  ({filteredTickets.length} {t('ticketManagement.results')})
                </p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setTicketDisplayPage(prev => Math.min(ticketTotalPages, prev + 1))}
              disabled={ticketDisplayPage >= ticketTotalPages || ticketLoading}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('ticketManagement.next')} →
            </Button>
          </div>

          <DialogFooter className="pt-4 border-t border-border/50 animate-in fade-in duration-500 delay-400 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => generateTicketPDF(selectedCode)}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              🖨️ {t('ticketManagement.printTicket')}
            </Button>
            <Button
              onClick={() => setOpenDialog(false)}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              {t('ticketManagement.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('ticketManagement.createNewTicket')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-barcode">{t('ticketManagement.barcode')} *</Label>
              <Input
                id="create-barcode"
                value={ticketForm.barcode}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, barcode: e.target.value })
                }
                placeholder={t('ticketManagement.enterBarcode')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-ticketCode">{t('ticketManagement.ticketCode')} *</Label>
              <Input
                id="create-ticketCode"
                value={ticketForm.ticketCode}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, ticketCode: e.target.value })
                }
                placeholder={t('ticketManagement.enterTicketCode')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreateDialog(false)
                setTicketForm({ barcode: "", ticketCode: "" })
              }}
              disabled={isSubmitting}
            >
              {t('ticketManagement.cancel')}
            </Button>
            <Button onClick={handleCreateTicket} disabled={isSubmitting}>
              {isSubmitting ? t('ticketManagement.creating') : t('ticketManagement.createTicket')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('ticketManagement.editTicket')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-barcode">{t('ticketManagement.barcode')} *</Label>
              <Input
                id="edit-barcode"
                value={ticketForm.barcode}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, barcode: e.target.value })
                }
                placeholder={t('ticketManagement.enterBarcode')}
              />
            </div>

          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditDialog(false)
                setSelectedTicket(null)
                setTicketForm({ barcode: "", ticketCode: "" })
              }}
              disabled={isSubmitting}
            >
              {t('ticketManagement.cancel')}
            </Button>
            <Button onClick={handleUpdateTicket} disabled={isSubmitting}>
              {isSubmitting ? t('ticketManagement.updating') : t('ticketManagement.updateTicket')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ticketManagement.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('ticketManagement.cannotBeUndone')} {t('ticketManagement.willPermanentlyDelete')} {t('ticketManagement.theTicket')} {t('ticketManagement.withBarcode')}{" "}
              <span className="font-mono font-semibold">
                {selectedTicket?.barcode}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setOpenDeleteDialog(false)
                setSelectedTicket(null)
              }}
              disabled={isSubmitting}
            >
              {t('ticketManagement.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? t('ticketManagement.deleting') : t('ticketManagement.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Ticket Code Dialog */}
      <Dialog open={openEditTicketCodeDialog} onOpenChange={setOpenEditTicketCodeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('ticketManagement.editTicketCode')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tc-learPN">{t('ticketManagement.learPN')}</Label>
              <Input
                id="edit-tc-learPN"
                value={ticketCodeForm.learPN}
                onChange={(e) =>
                  setTicketCodeForm({ ...ticketCodeForm, learPN: e.target.value })
                }
                placeholder={t('ticketManagement.enterLearPN')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tc-quantity">{t('ticketManagement.quantity')}</Label>
              <Input
                id="edit-tc-quantity"
                type="number"
                value={ticketCodeForm.quantity}
                onChange={(e) =>
                  setTicketCodeForm({ ...ticketCodeForm, quantity: e.target.value })
                }
                placeholder={t('ticketManagement.enterQuantity')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tc-hu">{t('ticketManagement.hu')}</Label>
              <Input
                id="edit-tc-hu"
                value={ticketCodeForm.hu}
                onChange={(e) =>
                  setTicketCodeForm({ ...ticketCodeForm, hu: e.target.value })
                }
                placeholder={t('ticketManagement.enterHu')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditTicketCodeDialog(false)
                setSelectedTicketCode(null)
                setTicketCodeForm({ learPN: "", quantity: "", hu: "" })
              }}
              disabled={isSubmitting}
            >
              {t('ticketManagement.cancel')}
            </Button>
            <Button onClick={handleUpdateTicketCode} disabled={isSubmitting}>
              {isSubmitting ? t('ticketManagement.updating') : t('ticketManagement.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Code Dialog */}
      <AlertDialog open={openDeleteTicketCodeDialog} onOpenChange={setOpenDeleteTicketCodeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ticketManagement.areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('ticketManagement.cannotBeUndone')} {t('ticketManagement.willPermanentlyDelete')} {t('ticketManagement.ticketCode')}{" "}
              <span className="font-mono font-semibold">
                {selectedTicketCode?.code}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setOpenDeleteTicketCodeDialog(false)
                setSelectedTicketCode(null)
              }}
              disabled={isSubmitting}
            >
              {t('ticketManagement.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicketCode}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? t('ticketManagement.deleting') : t('ticketManagement.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Get Ticket by Barcode Dialog */}
      <Dialog open={openBarcodeSearchDialog} onOpenChange={setOpenBarcodeSearchDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('ticketManagement.getTicketByBarcode')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="barcode-search">{t('ticketManagement.barcode')}</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode-search"
                  value={barcodeSearchInput}
                  onChange={(e) => setBarcodeSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchByBarcode()}
                  placeholder={t('ticketManagement.enterBarcode')}
                />
                <Button onClick={handleSearchByBarcode} disabled={barcodeSearchLoading}>
                  {barcodeSearchLoading ? t('ticketManagement.searching') : t('ticketManagement.search')}
                </Button>
              </div>
            </div>
            {barcodeSearchResult && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <h3 className="font-semibold">{t('ticketManagement.ticketFound')}:</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{t('ticketManagement.barcode')}</TableCell>
                      <TableCell className="font-mono">{barcodeSearchResult.barcode}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{t('ticketManagement.ticketCode')}</TableCell>
                      <TableCell className="font-mono">{barcodeSearchResult.ticketCode}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{t('ticketManagement.createdAt')}</TableCell>
                      <TableCell>{formatDate(barcodeSearchResult.createdAt)}</TableCell>
                    </TableRow>
                    {barcodeSearchResult.hu && (
                      <TableRow>
                        <TableCell className="font-medium">{t('ticketManagement.hu')}</TableCell>
                        <TableCell className="font-mono">{barcodeSearchResult.hu}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setOpenBarcodeSearchDialog(false)
                setBarcodeSearchInput("")
                setBarcodeSearchResult(null)
              }}
            >
              {t('ticketManagement.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

