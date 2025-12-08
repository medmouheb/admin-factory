
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
  const [data, setData] = useState<TicketCode[]>([])
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
          toast.success(`Loaded ${allTickets.length} ticket(s)`)
        }
      } else {
        setTickets(ticketsData)
        if (ticketsData.length > 0) {
          toast.success(`Loaded ${ticketsData.length} ticket(s)`)
        } else {
          toast.info("No tickets found for this code")
        }
      }
    } catch (err) {
      console.error("Error fetching tickets:", err)
      setTickets([])
      const errorMessage = err instanceof Error ? err.message : "Failed to load tickets"
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
      toast.error("Please fill in all fields")
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
        throw new Error(errorText || "Failed to create ticket")
      }

      toast.success("Ticket created successfully")
      setOpenCreateDialog(false)
      setTicketForm({ barcode: "", ticketCode: "" })
      // Refresh tickets
      if (selectedCode) {
        await fetchTicketsByCode(selectedCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create ticket"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!selectedTicket || !ticketForm.barcode) {
      toast.error("Please fill in all fields")
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
        throw new Error(errorText || "Failed to update ticket")
      }

      toast.success("Ticket updated successfully")
      setOpenEditDialog(false)
      setSelectedTicket(null)
      setTicketForm({ barcode: "", ticketCode: "" })
      // Refresh tickets
      if (selectedCode) {
        await fetchTicketsByCode(selectedCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update ticket"
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
        throw new Error(errorText || "Failed to delete ticket")
      }

      toast.success("Ticket deleted successfully")
      setOpenDeleteDialog(false)
      setSelectedTicket(null)
      // Refresh tickets
      if (selectedCode) {
        await fetchTicketsByCode(selectedCode)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete ticket"
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
        throw new Error(errorText || "Failed to update ticket code")
      }

      toast.success("Ticket code updated successfully")
      setOpenEditTicketCodeDialog(false)
      setSelectedTicketCode(null)
      setTicketCodeForm({ learPN: "", quantity: "", hu: "" })
      await fetchTicketCodes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update ticket code"
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
        throw new Error(errorText || "Failed to delete ticket code")
      }

      toast.success("Ticket code deleted successfully")
      setOpenDeleteTicketCodeDialog(false)
      setSelectedTicketCode(null)
      await fetchTicketCodes()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete ticket code"
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
      toast.error("Please enter a barcode")
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
      toast.success("Ticket found")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to find ticket"
      toast.error(errorMessage)
      setBarcodeSearchResult(null)
    } finally {
      setBarcodeSearchLoading(false)
    }
  }
  const { auth } = useAuthStore()

  const generateTicketPDF = (ticketCode: string) => {
    const doc = new jsPDF({ unit: 'cm', format: [5, 5] });

    let y = 0.3; // top margin

    // Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('tesca', 0.2, y);
    y += 0.5;

    // Ticket Code text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(paginatedTickets[0].learPN || "", 0.2, y);
    y += 0.4;


    // Ticket Code text
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Oper : ${auth.user?.matricule}` || "", 0.2, y);
    y += 0.4;

    // Barcode for ticket code
    const canvas1 = document.createElement('canvas');
    if (ticketCode) {
      JsBarcode(canvas1, ticketCode, {
        format: 'CODE128',
        width: 0.8,
        height: 20,
        displayValue: false,
      });
      doc.addImage(canvas1.toDataURL('image/png'), 'PNG', 0.2, y, 4.6, 1);
    }
    y += 1.1;

    // Ticket code (centered)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth(ticketCode || '');
    const xCentered = (5 - textWidth) / 2;
    doc.text(ticketCode || '', xCentered, y);
    y += 0.6;

    // Date & Time
    const now = new Date();
    doc.setFontSize(6);
    doc.text(
      `Date: ${now.toLocaleDateString()} Time: ${now.toLocaleTimeString()}`,
      0.2,
      y
    );

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
        // Cleanup
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
                Ticket Codes
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-lg"
              >
                Manage and track ticket codes
              </motion.p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate({ to: '/reapirage' })}
              className="bg-white text-purple-600 hover:bg-white/90 font-semibold shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Plus className="mr-2 h-4 w-4" /> New Ticket
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpenBarcodeSearchDialog(true)}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all duration-200 hover:scale-105"
            >
              <Search className="mr-2 h-4 w-4" /> Scan Barcode
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
              <CardTitle className="text-lg font-bold text-foreground">Filters & Search</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={resetFilters}
                  className="h-8 text-muted-foreground hover:text-foreground"
                >
                  Reset Filters ({activeFiltersCount})
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
                <Label htmlFor="search">Ticket code</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search ticket code..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hu">HU Number</Label>
                <Input
                  id="hu"
                  placeholder="Filter by HU..."
                  value={hu}
                  onChange={(e) => {
                    setHu(e.target.value)
                    setPage(1)
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
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
                <Label>Sort Order</Label>
                <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => {
                  setSortOrder(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest first</SelectItem>
                    <SelectItem value="asc">Oldest first</SelectItem>
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
                    Ticket Code
                  </TableHead>
                  <TableHead className="w-40 text-xs font-bold uppercase tracking-wider text-purple-900">
                    Operateur
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    Lear PN
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    Quantity
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    HU
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    Created At
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900 text-right">
                    Tickets
                  </TableHead>
                  {auth.user?.role !== 'operateur' && (
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-purple-900 text-right w-24">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && filteredData.length > 0 && filteredData.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className="group cursor-pointer hover:bg-purple-50/30 transition-colors duration-200"
                    onClick={() => handleOpenTickets(item.code)}
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
                           {item.quantity} units
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
                    <TableCell className="text-right">
                      <Badge variant={ticketBadgeVariant(item.totalTickets)} className="shadow-sm">
                        {item.totalTickets ?? "0"}
                      </Badge>
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditDialogForTicketCode(item)
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4 text-orange-500" />
                              Edit details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialogForTicketCode(item)
                              }}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete record
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
                          <h3 className="text-lg font-semibold">No tickets found</h3>
                          <p className="text-muted-foreground max-w-[400px]">
                            We couldn't find any ticket codes matching your current filter criteria.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={resetFilters}
                          className="mt-2"
                        >
                          Clear all filters
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
                          <h3 className="text-lg font-semibold">Loading data...</h3>
                          <p className="text-muted-foreground">
                            Please wait while we fetch the latest records.
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
              Showing <span className="font-medium text-foreground">{filteredData.length > 0 ? ((page - 1) * limit) + 1 : 0}</span> to <span className="font-medium text-foreground">{Math.min(page * limit, data.length)}</span> of <span className="font-medium text-foreground">{data.length || 0}</span> results
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPage}
                disabled={page === 1}
                className="shadow-sm bg-white"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm font-medium">Page {page} of {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={page === totalPages}
                className="shadow-sm bg-white"
              >
                Next
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
                  Tickets for: <span className="font-mono">{selectedCode}</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold">{tickets.length}</span> total records • <span className="font-semibold text-purple-600">{filteredTickets.length}</span> after filters
                </p>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1 animate-in fade-in duration-500 delay-200">
                {ticketFiltersCount} {ticketFiltersCount === 1 ? 'filter' : 'filters'} active
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 rounded-2xl border border-purple-100 bg-white/60 p-5 shadow-inner backdrop-blur animate-in slide-in-from-bottom-4 duration-500 delay-100 flex-1 overflow-y-auto min-h-0">
            {/* Enhanced Filters Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-muted-foreground">Filter Tickets</Label>
                <div className="flex items-center gap-2">

                  {ticketFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 transition-all duration-200 hover:scale-105"
                      onClick={resetTicketFilters}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ticket-search" className="text-xs text-muted-foreground">Search</Label>
                  <Input
                    id="ticket-search"
                    placeholder="Barcode or HU…"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-start" className="text-xs text-muted-foreground">From Date</Label>
                  <Input
                    id="ticket-start"
                    type="date"
                    value={ticketStartDate}
                    onChange={(e) => setTicketStartDate(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-end" className="text-xs text-muted-foreground">To Date</Label>
                  <Input
                    id="ticket-end"
                    type="date"
                    value={ticketEndDate}
                    onChange={(e) => setTicketEndDate(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ticket-sort" className="text-xs text-muted-foreground">Sort Order</Label>
                  <Select
                    value={ticketSort}
                    onValueChange={(value: "recent" | "oldest") =>
                      setTicketSort(value)
                    }
                  >
                    <SelectTrigger id="ticket-sort" className="transition-all duration-200 focus:scale-[1.02] focus:shadow-md">
                      <SelectValue placeholder="Sort by date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
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
                      <TableHead className="w-1/4 font-semibold text-xs uppercase tracking-wider">Ticket Barcode</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider">Created Date</TableHead>
                      <TableHead className="font-semibold text-xs uppercase tracking-wider text-right w-24">Actions</TableHead>
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
                              Loading tickets…
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedTickets.length > 0 ? (
                      paginatedTickets.map((t, index) => (
                        <TableRow
                          key={t.id}
                          className={`group transition-all duration-300 hover:bg-primary/10 hover:shadow-md hover:-translate-y-[1px] ${index % 2 === 0 ? "bg-background/50" : "bg-muted/10"} animate-in fade-in slide-in-from-left-4`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <p className="font-mono text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                                {t.barcode}
                              </p>
                              <p className="text-xs text-muted-foreground/70">
                                ID: {String(t.id).substring(0, 8)}...
                              </p>
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-foreground">
                                {formatDate(t.createdAt)}
                              </div>
                              <div className="text-xs text-muted-foreground/70">
                                {new Date(t.createdAt).toLocaleDateString(undefined, { weekday: "short" })}
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
                                  <span className="sr-only">Open menu</span>
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
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => openEditDialogForTicket(t)}
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
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialogForTicket(t)}
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
                                  Delete
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
                                ? "No tickets found for this batch."
                                : "No tickets match these filters."}
                            </p>
                            {tickets.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetTicketFilters}
                                className="text-xs"
                              >
                                Clear filters to see all tickets
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
              ← Previous
            </Button>

            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Page
              </p>
              <Badge variant="secondary" className="font-semibold">
                {ticketDisplayPage}
              </Badge>
              <p className="text-sm text-muted-foreground">
                of <b>{ticketTotalPages || 1}</b>
              </p>
              {filteredTickets.length > 0 && (
                <p className="text-xs text-muted-foreground/70">
                  ({filteredTickets.length} total)
                </p>
              )}
            </div>

            <Button
              variant="outline"
              onClick={() => setTicketDisplayPage(prev => Math.min(ticketTotalPages, prev + 1))}
              disabled={ticketDisplayPage >= ticketTotalPages || ticketLoading}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </Button>
          </div>

          <DialogFooter className="pt-4 border-t border-border/50 animate-in fade-in duration-500 delay-400 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => generateTicketPDF(selectedCode)}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              🖨️ Print Ticket
            </Button>
            <Button
              onClick={() => setOpenDialog(false)}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-barcode">Barcode *</Label>
              <Input
                id="create-barcode"
                value={ticketForm.barcode}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, barcode: e.target.value })
                }
                placeholder="Enter barcode"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-ticketCode">Ticket Code *</Label>
              <Input
                id="create-ticketCode"
                value={ticketForm.ticketCode}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, ticketCode: e.target.value })
                }
                placeholder="Enter ticket code"
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
              Cancel
            </Button>
            <Button onClick={handleCreateTicket} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-barcode">Barcode *</Label>
              <Input
                id="edit-barcode"
                value={ticketForm.barcode}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, barcode: e.target.value })
                }
                placeholder="Enter barcode"
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
              Cancel
            </Button>
            <Button onClick={handleUpdateTicket} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              ticket with barcode{" "}
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
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicket}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Ticket Code Dialog */}
      <Dialog open={openEditTicketCodeDialog} onOpenChange={setOpenEditTicketCodeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Ticket Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tc-learPN">Lear PN</Label>
              <Input
                id="edit-tc-learPN"
                value={ticketCodeForm.learPN}
                onChange={(e) =>
                  setTicketCodeForm({ ...ticketCodeForm, learPN: e.target.value })
                }
                placeholder="Enter Lear PN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tc-quantity">Quantity</Label>
              <Input
                id="edit-tc-quantity"
                type="number"
                value={ticketCodeForm.quantity}
                onChange={(e) =>
                  setTicketCodeForm({ ...ticketCodeForm, quantity: e.target.value })
                }
                placeholder="Enter quantity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tc-hu">HU</Label>
              <Input
                id="edit-tc-hu"
                value={ticketCodeForm.hu}
                onChange={(e) =>
                  setTicketCodeForm({ ...ticketCodeForm, hu: e.target.value })
                }
                placeholder="Enter HU"
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
              Cancel
            </Button>
            <Button onClick={handleUpdateTicketCode} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Code Dialog */}
      <AlertDialog open={openDeleteTicketCodeDialog} onOpenChange={setOpenDeleteTicketCodeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              ticket code{" "}
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
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTicketCode}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Get Ticket by Barcode Dialog */}
      <Dialog open={openBarcodeSearchDialog} onOpenChange={setOpenBarcodeSearchDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Get Ticket by Barcode</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="barcode-search">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode-search"
                  value={barcodeSearchInput}
                  onChange={(e) => setBarcodeSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchByBarcode()}
                  placeholder="Enter barcode"
                />
                <Button onClick={handleSearchByBarcode} disabled={barcodeSearchLoading}>
                  {barcodeSearchLoading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
            {barcodeSearchResult && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <h3 className="font-semibold">Ticket Found:</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Barcode</TableCell>
                      <TableCell className="font-mono">{barcodeSearchResult.barcode}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ticket Code</TableCell>
                      <TableCell className="font-mono">{barcodeSearchResult.ticketCode}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Created At</TableCell>
                      <TableCell>{formatDate(barcodeSearchResult.createdAt)}</TableCell>
                    </TableRow>
                    {barcodeSearchResult.hu && (
                      <TableRow>
                        <TableCell className="font-medium">HU</TableCell>
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
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

