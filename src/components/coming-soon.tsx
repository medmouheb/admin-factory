
import { useCallback, useEffect, useMemo, useState } from "react"
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
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import { useAuthStore } from "@/stores/auth-store"

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
}

export function ComingSoon() {
  const [data, setData] = useState<TicketCode[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
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
    learPN: "",
    ticketCode: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

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
  }, [page, limit, searchQuery, sortOrder, startDate, endDate])

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
        `http://localhost:8080/api/tickets/search?page=1&limit=100&search=${encodeURIComponent(code)}`
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
              `http://localhost:8080/api/tickets/search?page=${page}&limit=100&search=${encodeURIComponent(code)}`
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
    if (!ticketForm.barcode || !ticketForm.learPN || !ticketForm.ticketCode) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("http://localhost:8080/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: ticketForm.barcode,
          learPN: ticketForm.learPN,
          ticketCode: ticketForm.ticketCode,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to create ticket")
      }

      toast.success("Ticket created successfully")
      setOpenCreateDialog(false)
      setTicketForm({ barcode: "", learPN: "", ticketCode: "" })
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
    if (!selectedTicket || !ticketForm.barcode || !ticketForm.learPN) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`http://localhost:8080/api/tickets/${selectedTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: ticketForm.barcode,
          learPN: ticketForm.learPN,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to update ticket")
      }

      toast.success("Ticket updated successfully")
      setOpenEditDialog(false)
      setSelectedTicket(null)
      setTicketForm({ barcode: "", learPN: "", ticketCode: "" })
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
        }, 1000);
      }, 100);
    };
  };

  const openEditDialogForTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setTicketForm({
      barcode: ticket.barcode,
      learPN: ticket.learPN,
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
      learPN: "",
      ticketCode: selectedCode,
    })
    setOpenCreateDialog(true)
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
    setStartDate("")
    setEndDate("")
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
    if (startDate) count += 1
    if (endDate) count += 1
    if (sortOrder === "asc") count += 1
    if (minTickets) count += 1
    if (maxTickets) count += 1
    if (timePreset !== "all") count += 1
    return count
  }, [searchQuery, startDate, endDate, sortOrder, minTickets, maxTickets, timePreset])

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
      setStartDate("")
      setEndDate("")
      return
    }

    const end = new Date()
    const start = new Date()

    if (value === "24h") start.setDate(end.getDate() - 1)
    if (value === "7d") start.setDate(end.getDate() - 7)
    if (value === "30d") start.setDate(end.getDate() - 30)

    const format = (date: Date) => date.toISOString().substring(0, 10)
    setEndDate(format(end))
    setStartDate(format(start))
    setPage(1)
  }

  const ticketBadgeVariant = (qty?: number) => {
    if (!qty || qty <= 0) return "outline"
    if (qty >= 50) return "default"
    if (qty >= 20) return "secondary"
    return "destructive"
  }

  return (
    <div className="p-6 space-y-4 animate-in fade-in duration-500">
      <h1 className="text-2xl font-semibold animate-in slide-in-from-top-4 duration-700">
        Ticket Codes
      </h1>

      <div className="rounded-2xl border border-border/60 bg-card/50 p-4 shadow-lg backdrop-blur animate-in slide-in-from-bottom-4 duration-700 delay-100">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Filters</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="transition-all duration-300 hover:scale-105">
                {activeFiltersCount} active
              </Badge>
              {activeFiltersCount > 0 && (
                <Button
                  variant="link"
                  className="px-0 text-xs transition-all duration-200 hover:scale-105"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTicketCodes()}
              className="transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              Refresh
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="search">Ticket code</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="e.g. TK-00001"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">From</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">To</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Sort</Label>
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

        <Separator className="my-4" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="minTickets">Min tickets</Label>
            <Input
              id="minTickets"
              type="number"
              min={0}
              value={minTickets}
              onChange={(e) => {
                setMinTickets(e.target.value)
                setPage(1)
              }}
              placeholder="e.g. 10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTickets">Max tickets</Label>
            <Input
              id="maxTickets"
              type="number"
              min={0}
              value={maxTickets}
              onChange={(e) => {
                setMaxTickets(e.target.value)
                setPage(1)
              }}
              placeholder="e.g. 80"
            />
          </div>

          <div className="space-y-2">
            <Label>Quick range</Label>
            <Select
              value={timePreset}
              onValueChange={(value: "all" | "24h" | "7d" | "30d") => handlePresetChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 rounded-xl border border-dashed border-border/60 bg-muted/30 p-3 text-sm">
            <p className="font-medium text-muted-foreground">Active filters</p>
            <p className="text-xs text-muted-foreground/70">
              Combine ranges and ticket counts to pinpoint the exact batches to audit.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/80 to-muted/40 shadow-2xl shadow-primary/10 backdrop-blur">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="w-40 text-xs uppercase tracking-wide">
                Ticket Code
              </TableHead>
              <TableHead className="w-40 text-xs uppercase tracking-wide">
                Operateur
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide">
                Lear PN
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide">
                Quantity
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide">
                HU
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide">
                Created At
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-right">
                Tickets
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && filteredData.length > 0 && filteredData.map((item, index) => (
              <TableRow
                key={item.id}
                className={`group cursor-pointer border-b border-border/40 transition-all duration-300 hover:-translate-y-[2px] hover:bg-primary/10 hover:shadow-md ${index % 2 === 0 ? "bg-background/40" : "bg-muted/20"} animate-in fade-in slide-in-from-left-4`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleOpenTickets(item.code)}
              >
                <TableCell className="flex items-center gap-3 font-semibold text-primary">
                  <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary shadow-inner">
                    {((page - 1) * limit) + index + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="text-base">{item.code}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {item.id}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span> {item.matricule}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="font-mono">{item.learPN || '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span>{item.quantity || '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs">{item.hu || '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span>{formatDate(item.createdAt)}</span>
                    <span className="text-xs text-muted-foreground/70">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { weekday: "long" })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={ticketBadgeVariant(item.totalTickets)}>
                    {item.totalTickets ?? "—"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}

            {!loading && filteredData.length === 0 && (
              <TableRow className="animate-in fade-in duration-500">
                <TableCell colSpan={3} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-base font-medium text-muted-foreground">
                      No ticket codes match these filters.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs mt-2 transition-all duration-200 hover:scale-105"
                    >
                      Clear all filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {loading && (
              <TableRow className="animate-in fade-in duration-300">
                <TableCell colSpan={3} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm text-muted-foreground animate-pulse">
                      Loading results…
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button
          variant="outline"
          onClick={prevPage}
          disabled={page === 1}
          className="transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </Button>

        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">Page</p>
          <Badge variant="secondary" className="font-semibold">
            {page}
          </Badge>
          <p className="text-sm text-muted-foreground">
            of <b>{totalPages}</b>
          </p>
        </div>

        <Button
          variant="outline"
          onClick={nextPage}
          disabled={page === totalPages}
          className="transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </Button>
      </div>

      {/* ---------------------- */}
      {/* TICKETS POPUP DIALOG   */}
      {/* ---------------------- */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader className="animate-in slide-in-from-top-4 duration-500 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Tickets for: <span className="font-mono">{selectedCode}</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-semibold">{tickets.length}</span> total records • <span className="font-semibold text-primary">{filteredTickets.length}</span> after filters
                </p>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1 animate-in fade-in duration-500 delay-200">
                {ticketFiltersCount} {ticketFiltersCount === 1 ? 'filter' : 'filters'} active
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/60 to-muted/30 p-5 shadow-xl backdrop-blur animate-in slide-in-from-bottom-4 duration-500 delay-100 flex-1 overflow-y-auto min-h-0">
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
              <Label htmlFor="create-learPN">Lear PN *</Label>
              <Input
                id="create-learPN"
                value={ticketForm.learPN}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, learPN: e.target.value })
                }
                placeholder="Enter Lear PN"
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
                setTicketForm({ barcode: "", learPN: "", ticketCode: "" })
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
            <div className="space-y-2">
              <Label htmlFor="edit-learPN">Lear PN *</Label>
              <Input
                id="edit-learPN"
                value={ticketForm.learPN}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, learPN: e.target.value })
                }
                placeholder="Enter Lear PN"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenEditDialog(false)
                setSelectedTicket(null)
                setTicketForm({ barcode: "", learPN: "", ticketCode: "" })
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
    </div>
  )
}

