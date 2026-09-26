
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
  X,
  ClipboardList,
  FileSpreadsheet,
  Users,
  Package,
  Clock,
  Sparkles,
  Tag,
  Sunrise,
  Sun,
  Moon
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
  const [operatorFilter, setOperatorFilter] = useState("")
  const [learPNFilter, setLearPNFilter] = useState("")
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

  // Shift Report states
  const [openShiftReport, setOpenShiftReport] = useState(false)
  const [shiftReportDate, setShiftReportDate] = useState(() => new Date().toISOString().split('T')[0])
  const [shiftReportSearch, setShiftReportSearch] = useState("")
  const [shiftReportFilter, setShiftReportFilter] = useState<"all" | "morning" | "afternoon" | "night">("all")
  const [shiftReportSummary, setShiftReportSummary] = useState<{
    totalOps: number
    totalCodes: number
    totalHU: number
    totalQty: number
    shifts: {
      morning: { name: string; hours: string; tcodes: number; hu: number; qty: number; opsCount: number; percentage: number }
      afternoon: { name: string; hours: string; tcodes: number; hu: number; qty: number; opsCount: number; percentage: number }
      night: { name: string; hours: string; tcodes: number; hu: number; qty: number; opsCount: number; percentage: number }
    }
  } | null>(null)
  const [shiftReportData, setShiftReportData] = useState<{
    matricule: string
    name?: string
    totalHU: number
    totalCodes: number
    totalQty?: number
    sharePercentage?: number
    shifts?: {
      morning: { tcodes: number; hu: number; qty?: number }
      afternoon: { tcodes: number; hu: number; qty?: number }
      night: { tcodes: number; hu: number; qty?: number }
    }
    codes: { code: string; hu: string; learPN: string; quantity: number; createdAt: string; shift?: string }[]
  }[]>([])
  const [shiftReportLoading, setShiftReportLoading] = useState(false)

  const shiftReportStats = useMemo(() => {
    if (shiftReportSummary) {
      return shiftReportSummary
    }
    const totalOps = shiftReportData.length
    const totalHU = shiftReportData.reduce((acc, curr) => acc + (curr.totalHU || 0), 0)
    const totalCodes = shiftReportData.reduce((acc, curr) => acc + (curr.totalCodes || 0), 0)
    const totalQty = shiftReportData.reduce((acc, curr) => acc + (curr.totalQty || 0), 0)
    return {
      totalOps,
      totalHU,
      totalCodes,
      totalQty,
      shifts: {
        morning: { name: "Shift Matin", hours: "06h00 - 14h00", tcodes: 0, hu: 0, qty: 0, opsCount: 0, percentage: 0 },
        afternoon: { name: "Shift Après-midi", hours: "14h00 - 22h00", tcodes: 0, hu: 0, qty: 0, opsCount: 0, percentage: 0 },
        night: { name: "Shift Nuit", hours: "22h00 - 06h00", tcodes: 0, hu: 0, qty: 0, opsCount: 0, percentage: 0 },
      }
    }
  }, [shiftReportData, shiftReportSummary])

  const filteredShiftReportData = useMemo(() => {
    let list = shiftReportData

    // Shift filter (morning / afternoon / night)
    if (shiftReportFilter !== "all") {
      list = list.filter((op) => {
        const s = op.shifts?.[shiftReportFilter]
        return s && s.tcodes > 0
      })
    }

    if (!shiftReportSearch.trim()) return list
    const q = shiftReportSearch.toLowerCase().trim()
    return list.filter((op) => {
      const matchOp = op.matricule.toLowerCase().includes(q) || (op.name && op.name.toLowerCase().includes(q))
      const matchCode = op.codes.some(
        c => c.code.toLowerCase().includes(q) ||
             (c.hu && c.hu.toLowerCase().includes(q)) ||
             (c.learPN && c.learPN.toLowerCase().includes(q))
      )
      return matchOp || matchCode
    })
  }, [shiftReportData, shiftReportSearch, shiftReportFilter])

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
      if (operatorFilter) params.append("matricule", operatorFilter)
      if (learPNFilter) params.append("learPN", learPNFilter)
      if (date) params.append("date", date)
      if (timePreset && timePreset !== "all") params.append("time", timePreset)


      const res = await fetch(
        `/api/ticketscode/ticket-code?${params.toString()}`, {
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
  }, [page, limit, searchQuery, sortOrder, hu, operatorFilter, learPNFilter, date, timePreset])

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
        `/api/tickets/search?page=1&limit=100&search=${encodeURIComponent(code)}`,
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
              `/api/tickets/search?page=${page}&limit=100&search=${encodeURIComponent(code)}`,
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
      const res = await fetch("/api/tickets", {
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
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
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
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
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
      const res = await fetch(`/api/ticketscode/${selectedTicketCode.id}`, {
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
      const res = await fetch(`/api/ticketscode/${selectedTicketCode.id}`, {
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
      const res = await fetch(`/api/tickets/barcode/${encodeURIComponent(barcodeSearchInput)}`, { credentials: 'include' })

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

  // ─── Generate label PDF for a ticket code (TicketCode record) ───
  const generateTicketPDF = (ticketCode: string) => {
    // MUST always use the exact T-code passed or currently selected
    const codeToPrint = ticketCode || selectedCode || selectedOne?.code
    if (!codeToPrint) {
      toast.error('Aucun code T-Code sélectionné')
      return
    }

    // Find the exact TicketCode record matching this code
    const target = data.find(d => d.code === codeToPrint) || (selectedOne?.code === codeToPrint ? selectedOne : null)

    const doc = new jsPDF({ unit: 'cm', format: [5, 5] });
    const m = 0.2; const w = 4.6; const h = 4.6
    doc.setLineWidth(0.02); doc.setDrawColor(0)
    doc.rect(m, m, w, h)
    doc.line(m, 0.9, m + w, 0.9)
    doc.line(m, 1.5, m + w, 1.5)
    doc.line(m, 3.9, m + w, 3.9)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
    doc.text('TESCA', m + 0.2, 0.7)
    doc.text('SK', m + w - 0.2, 0.7, { align: 'right' })

    const ref = target?.learPN || selectedOne?.learPN || ""
    doc.setFontSize(11)
    doc.text(ref, 2.5, 1.35, { align: 'center' })

    // Barcode: MUST ALWAYS BE THE EXACT SAME T-CODE (e.g. FLY60NCPAF)
    const canvas1 = document.createElement('canvas');
    JsBarcode(canvas1, codeToPrint, {
      format: 'CODE128',
      width: 4,
      height: 80,
      displayValue: false,
      margin: 0
    });
    doc.addImage(canvas1.toDataURL('image/png'), 'PNG', m + 0.1, 1.6, w - 0.2, 1.8);

    doc.setFontSize(10)
    doc.text(codeToPrint, 2.5, 3.75, { align: 'center' })

    doc.setFontSize(9)
    const opMat = target?.matricule || selectedOne?.matricule || auth.user?.matricule || ''
    const opQty = target?.quantity != null ? target.quantity : (selectedOne?.quantity != null ? selectedOne.quantity : tickets.length)
    doc.text(`Op: ${opMat}`, m + 0.1, 4.3)
    doc.text(`Qty: ${opQty}`, m + w - 0.1, 4.3, { align: 'right' })

    doc.setFontSize(7); doc.setFont('helvetica', 'normal')
    const dateVal = target?.createdAt || selectedOne?.createdAt || ''
    const now = dateVal ? new Date(dateVal) : new Date()
    doc.text(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), 2.5, 4.7, { align: 'center' })
    printPDF(doc)
    toast.success(`Étiquette imprimée pour le T-Code ${codeToPrint}`)
  };

  // ─── Reprint label for the same ticket code (T-Code) ───
  const reprintTicketLabel = (ticket: Ticket) => {
    // Print the EXACT SAME T-code for this ticket
    const codeToPrint = ticket.ticketCode || selectedCode || selectedOne?.code
    if (!codeToPrint) {
      toast.error('Code T-Code introuvable')
      return
    }

    const target = data.find(d => d.code === codeToPrint) || (selectedOne?.code === codeToPrint ? selectedOne : null)

    const doc = new jsPDF({ unit: 'cm', format: [5, 5] });
    const m = 0.2; const w = 4.6; const h = 4.6
    doc.setLineWidth(0.02); doc.setDrawColor(0)
    doc.rect(m, m, w, h)
    doc.line(m, 0.9, m + w, 0.9)
    doc.line(m, 1.5, m + w, 1.5)
    doc.line(m, 3.9, m + w, 3.9)

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
    doc.text('TESCA', m + 0.2, 0.7)
    doc.text('SK', m + w - 0.2, 0.7, { align: 'right' })

    const ref = target?.learPN || selectedOne?.learPN || ""
    doc.setFontSize(11)
    doc.text(ref, 2.5, 1.35, { align: 'center' })

    // Barcode: MUST ALWAYS BE THE EXACT SAME T-CODE
    const canvas1 = document.createElement('canvas');
    JsBarcode(canvas1, codeToPrint, {
      format: 'CODE128',
      width: 4,
      height: 80,
      displayValue: false,
      margin: 0
    });
    doc.addImage(canvas1.toDataURL('image/png'), 'PNG', m + 0.1, 1.6, w - 0.2, 1.8);

    doc.setFontSize(10)
    doc.text(codeToPrint, 2.5, 3.75, { align: 'center' })

    doc.setFontSize(9)
    const opMat = target?.matricule || selectedOne?.matricule || auth.user?.matricule || ''
    const opQty = target?.quantity != null ? target.quantity : (selectedOne?.quantity != null ? selectedOne.quantity : tickets.length)
    doc.text(`Op: ${opMat}`, m + 0.1, 4.3)
    doc.text(`Qty: ${opQty}`, m + w - 0.1, 4.3, { align: 'right' })

    doc.setFontSize(7); doc.setFont('helvetica', 'normal')
    const dateVal = target?.createdAt || ticket.createdAt || selectedOne?.createdAt || ''
    const now = dateVal ? new Date(dateVal) : new Date()
    doc.text(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), 2.5, 4.7, { align: 'center' })
    printPDF(doc)
    toast.success(`Étiquette réimprimée : ${codeToPrint}`)
  };

  // ─── Shared PDF print helper ───
  const printPDF = (doc: jsPDF) => {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 10000);
      }, 100);
    };
  };

  // ─── Shift report ───
  const fetchShiftReport = async (dateStr: string) => {
    setShiftReportLoading(true)
    try {
      const res = await fetch(`/api/ticketscode/shift-report?date=${dateStr}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Erreur serveur')
      const json = await res.json()
      setShiftReportData(json.data || [])
      setShiftReportSummary(json.summary || null)
    } catch (e) {
      toast.error('Erreur chargement rapport de shift')
      setShiftReportData([])
      setShiftReportSummary(null)
    } finally {
      setShiftReportLoading(false)
    }
  }

  const generateShiftReportPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = 210; const margin = 14
    const date = new Date(shiftReportDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    // Header
    doc.setFillColor(88, 28, 135); doc.rect(0, 0, pageW, 28, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
    doc.text('TESCA — ÉTAT JOURNALISÉ DE SHIFT', pageW / 2, 12, { align: 'center' })
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.text(`Date : ${date}`, pageW / 2, 22, { align: 'center' })
    doc.setTextColor(0, 0, 0)

    let y = 36
    shiftReportData.forEach((op, i) => {
      // Operator header
      doc.setFillColor(237, 233, 254)
      doc.rect(margin, y, pageW - margin * 2, 8, 'F')
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
      doc.text(`Opérateur : ${op.name ? `${op.matricule} - ${op.name}` : op.matricule}`, margin + 2, y + 5.5)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
      doc.text(`HU : ${op.totalHU}  |  T-Codes : ${op.totalCodes}${op.totalQty ? `  |  Pièces : ${op.totalQty}` : ''}`, pageW - margin - 2, y + 5.5, { align: 'right' })
      y += 10

      // Table header
      doc.setFillColor(109, 40, 217)
      doc.rect(margin, y, pageW - margin * 2, 6, 'F')
      doc.setTextColor(255, 255, 255); doc.setFontSize(8)
      doc.text('T-CODE', margin + 2, y + 4)
      doc.text('HU', margin + 50, y + 4)
      doc.text('REF LEAR', margin + 90, y + 4)
      doc.text('QTÉ', margin + 130, y + 4)
      doc.text('HEURE', margin + 150, y + 4)
      doc.setTextColor(0, 0, 0)
      y += 8

      op.codes.forEach((c, ci) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setFillColor(ci % 2 === 0 ? 250 : 245, ci % 2 === 0 ? 248 : 243, 255)
        doc.rect(margin, y, pageW - margin * 2, 5.5, 'F')
        doc.setFontSize(7.5)
        doc.text(c.code, margin + 2, y + 4)
        doc.text(c.hu || '—', margin + 50, y + 4)
        doc.text(c.learPN || '—', margin + 90, y + 4)
        doc.text(String(c.quantity || 0), margin + 130, y + 4)
        doc.text(new Date(c.createdAt).toLocaleTimeString(), margin + 150, y + 4)
        y += 6
      })
      y += 8
    })

    // Footer
    doc.setFontSize(7); doc.setTextColor(120)
    doc.text(`Généré le ${new Date().toLocaleString()}`, pageW / 2, 290, { align: 'center' })
    printPDF(doc)
  }

  const downloadShiftReportExcel = async () => {
    try {
      const res = await fetch(`/api/ticketscode/shift-report/excel?date=${shiftReportDate}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error("Erreur serveur lors de l'export Excel")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `etat_shift_${shiftReportDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Rapport Excel téléchargé avec succès')
    } catch (e) {
      toast.error("Impossible de télécharger le fichier Excel")
    }
  }

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
    // Synchronize selectedOne with the exact item clicked
    const found = data.find((d) => d.code === code)
    if (found) {
      setSelectedOne(found)
    }
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
    setOperatorFilter("")
    setLearPNFilter("")
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
    if (operatorFilter) count += 1
    if (learPNFilter) count += 1
    if (hu) count += 1
    if (date) count += 1
    if (sortOrder === "asc") count += 1
    if (minTickets) count += 1
    if (maxTickets) count += 1
    if (timePreset !== "all") count += 1
    return count
  }, [searchQuery, operatorFilter, learPNFilter, hu, date, sortOrder, minTickets, maxTickets, timePreset])

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
            {auth.user?.role !== 'operateur' && (
              <Button
                variant="outline"
                onClick={() => { setOpenShiftReport(true); fetchShiftReport(shiftReportDate) }}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm transition-all duration-200 hover:scale-105"
              >
                <ClipboardList className="mr-2 h-4 w-4" /> État de Shift
              </Button>
            )}
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                <Label htmlFor="filter-operator">{t('ticketManagement.operateur')}</Label>
                <div className="relative">
                  <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-operator"
                    placeholder={t('ticketManagement.filterByOperator', 'Filtrer par opérateur...')}
                    value={operatorFilter}
                    onChange={(e) => {
                      setOperatorFilter(e.target.value)
                      setPage(1)
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filter-learPN">{t('ticketManagement.learPN')}</Label>
                <div className="relative">
                  <Tag className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-learPN"
                    placeholder={t('ticketManagement.filterByLearPN', 'Filtrer par Lear PN...')}
                    value={learPNFilter}
                    onChange={(e) => {
                      setLearPNFilter(e.target.value)
                      setPage(1)
                    }}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hu">{t('ticketManagement.huNumber')}</Label>
                <div className="relative">
                  <Package className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="hu"
                    placeholder={t('ticketManagement.filterByHu')}
                    value={hu}
                    onChange={(e) => {
                      setHu(e.target.value)
                      setPage(1)
                    }}
                    className="pl-8"
                  />
                </div>
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
                                // ✅ Réimprimer — visible à tous les rôles
                                <DropdownMenuItem
                                  onClick={() => reprintTicketLabel(ticket)}
                                  className="cursor-pointer text-purple-700 focus:text-purple-700"
                                >
                                  <Printer className="mr-2 h-4 w-4" />
                                  Réimprimer l'étiquette
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {auth.user?.role !== 'operateur' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => openEditDialogForTicket(ticket)}
                                      className="cursor-pointer"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      {t('ticketManagement.editDetails')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialogForTicket(ticket)}
                                      className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t('ticketManagement.delete')}
                                    </DropdownMenuItem>
                                  </>
                                )}
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
              <Printer className="mr-2 h-4 w-4" />
              {t('ticketManagement.printTicket')}
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

      {/* ─────────────────────────────── */}
      {/* SHIFT REPORT DIALOG (PREMIUM)   */}
      {/* ─────────────────────────────── */}
      <Dialog open={openShiftReport} onOpenChange={setOpenShiftReport}>
        <DialogContent
          showCloseButton={false}
          className="max-w-5xl max-h-[92vh] p-0 overflow-hidden flex flex-col gap-0 rounded-2xl border border-purple-200/80 dark:border-purple-900/60 shadow-2xl bg-background"
        >
          {/* Hero Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-900 text-white p-5 md:p-6 pr-14 select-none">
            {/* Ambient decorative glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 left-1/3 w-36 h-36 bg-pink-500/15 rounded-full blur-xl pointer-events-none" />

            {/* Custom Close Button */}
            <button
              onClick={() => setOpenShiftReport(false)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xs"
              title="Fermer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-inner flex items-center justify-center shrink-0">
                  <ClipboardList className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                      État Journalisé de Shift
                    </h2>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Journal de production
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-purple-200/90 mt-1">
                    Supervision complète des Unités de Manutention (HU) et T-Codes préparés par opérateur
                  </p>
                </div>
              </div>

              {/* Formatted Date Pill */}
              <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs">
                <Calendar className="h-3.5 w-3.5 text-purple-200" />
                <span>
                  {new Date(shiftReportDate + 'T00:00:00').toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 md:px-6 md:py-3.5 bg-gradient-to-b from-purple-50/60 dark:from-purple-950/20 to-background border-b border-border/60">
            {/* KPI 1 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs hover:border-purple-300 dark:hover:border-purple-800 transition-all">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Opérateurs</p>
                <p className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight leading-none mt-0.5">
                  {shiftReportStats.totalOps}
                </p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total HU</p>
                <p className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none mt-0.5">
                  {shiftReportStats.totalHU}
                </p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                <Barcode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total T-Codes</p>
                <p className="text-xl md:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight leading-none mt-0.5">
                  {shiftReportStats.totalCodes}
                </p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs hover:border-teal-300 dark:hover:border-teal-800 transition-all">
              <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Pièces</p>
                <p className="text-xl md:text-2xl font-extrabold text-teal-600 dark:text-teal-400 tracking-tight leading-none mt-0.5">
                  {shiftReportStats.totalQty || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Shift Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 md:px-6 py-3 bg-muted/15 border-b border-border/60">
            {/* Shift 1: Matin */}
            <div
              onClick={() => setShiftReportFilter(shiftReportFilter === 'morning' ? 'all' : 'morning')}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                shiftReportFilter === 'morning'
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                  : 'bg-card border-border/80 hover:border-amber-400/60 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Sunrise className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Shift Matin</p>
                    <p className="text-[10px] text-muted-foreground">06h00 - 14h00</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-amber-100/70 text-amber-800 border-amber-300">
                  {shiftReportStats.shifts.morning.percentage}%
                </Badge>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">{shiftReportStats.shifts.morning.tcodes} <span className="font-normal text-muted-foreground text-[10px]">T-Codes</span></span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{shiftReportStats.shifts.morning.hu} <span className="font-normal text-muted-foreground text-[10px]">HU</span></span>
                <span className="text-[10px] text-muted-foreground">{shiftReportStats.shifts.morning.opsCount} op.</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: `${shiftReportStats.shifts.morning.percentage}%` }} />
              </div>
            </div>

            {/* Shift 2: Après-midi */}
            <div
              onClick={() => setShiftReportFilter(shiftReportFilter === 'afternoon' ? 'all' : 'afternoon')}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                shiftReportFilter === 'afternoon'
                  ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/30 shadow-sm'
                  : 'bg-card border-border/80 hover:border-sky-400/60 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                    <Sun className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Shift Après-midi</p>
                    <p className="text-[10px] text-muted-foreground">14h00 - 22h00</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-sky-100/70 text-sky-800 border-sky-300">
                  {shiftReportStats.shifts.afternoon.percentage}%
                </Badge>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">{shiftReportStats.shifts.afternoon.tcodes} <span className="font-normal text-muted-foreground text-[10px]">T-Codes</span></span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{shiftReportStats.shifts.afternoon.hu} <span className="font-normal text-muted-foreground text-[10px]">HU</span></span>
                <span className="text-[10px] text-muted-foreground">{shiftReportStats.shifts.afternoon.opsCount} op.</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full" style={{ width: `${shiftReportStats.shifts.afternoon.percentage}%` }} />
              </div>
            </div>

            {/* Shift 3: Nuit */}
            <div
              onClick={() => setShiftReportFilter(shiftReportFilter === 'night' ? 'all' : 'night')}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                shiftReportFilter === 'night'
                  ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30 shadow-sm'
                  : 'bg-card border-border/80 hover:border-purple-400/60 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Moon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Shift Nuit</p>
                    <p className="text-[10px] text-muted-foreground">22h00 - 06h00</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-purple-100/70 text-purple-800 border-purple-300">
                  {shiftReportStats.shifts.night.percentage}%
                </Badge>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">{shiftReportStats.shifts.night.tcodes} <span className="font-normal text-muted-foreground text-[10px]">T-Codes</span></span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{shiftReportStats.shifts.night.hu} <span className="font-normal text-muted-foreground text-[10px]">HU</span></span>
                <span className="text-[10px] text-muted-foreground">{shiftReportStats.shifts.night.opsCount} op.</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" style={{ width: `${shiftReportStats.shifts.night.percentage}%` }} />
              </div>
            </div>
          </div>

          {/* Interactive Toolbar */}
          <div className="px-4 md:px-6 py-3 bg-muted/20 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
            {/* Left controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1 shadow-xs hover:border-purple-400 transition-colors">
                <Calendar className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <Input
                  type="date"
                  value={shiftReportDate}
                  onChange={(e) => {
                    setShiftReportDate(e.target.value)
                    fetchShiftReport(e.target.value)
                  }}
                  className="border-0 p-0 h-6 w-33 shadow-none focus-visible:ring-0 text-xs font-semibold cursor-pointer"
                />
              </div>

              {/* Quick Date Presets */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setShiftReportDate(today)
                  fetchShiftReport(today)
                }}
                className="h-8 px-2.5 text-xs font-medium"
              >
                Aujourd'hui
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const d = new Date()
                  d.setDate(d.getDate() - 1)
                  const hier = d.toISOString().split('T')[0]
                  setShiftReportDate(hier)
                  fetchShiftReport(hier)
                }}
                className="h-8 px-2.5 text-xs font-medium"
              >
                Hier
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchShiftReport(shiftReportDate)}
                className="h-8 gap-1.5 px-2.5 text-xs font-medium"
                title="Actualiser les données"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${shiftReportLoading ? 'animate-spin text-purple-600' : ''}`} />
                Actualiser
              </Button>

              {/* Shift Quick Filter Pills */}
              <div className="hidden lg:flex items-center gap-1 border-l border-border/60 pl-2">
                <Button
                  variant={shiftReportFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShiftReportFilter('all')}
                  className="h-7 px-2 text-[11px] font-medium"
                >
                  Tous
                </Button>
                <Button
                  variant={shiftReportFilter === 'morning' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShiftReportFilter('morning')}
                  className="h-7 px-2 text-[11px] font-medium gap-1"
                >
                  <Sunrise className="h-3 w-3" /> Matin
                </Button>
                <Button
                  variant={shiftReportFilter === 'afternoon' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShiftReportFilter('afternoon')}
                  className="h-7 px-2 text-[11px] font-medium gap-1"
                >
                  <Sun className="h-3 w-3" /> Après-midi
                </Button>
                <Button
                  variant={shiftReportFilter === 'night' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShiftReportFilter('night')}
                  className="h-7 px-2 text-[11px] font-medium gap-1"
                >
                  <Moon className="h-3 w-3" /> Nuit
                </Button>
              </div>

              {/* Live search input */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher opérateur, T-code, HU..."
                  value={shiftReportSearch}
                  onChange={(e) => setShiftReportSearch(e.target.value)}
                  className="h-8 pl-8 pr-7 text-xs w-44 md:w-56 rounded-lg bg-background"
                />
                {shiftReportSearch && (
                  <button
                    onClick={() => setShiftReportSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                onClick={downloadShiftReportExcel}
                disabled={shiftReportData.length === 0 || shiftReportLoading}
                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-medium text-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Exporter Excel
              </Button>
              <Button
                size="sm"
                onClick={generateShiftReportPDF}
                disabled={shiftReportData.length === 0 || shiftReportLoading}
                className="h-8 gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs font-medium text-xs transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimer le rapport
              </Button>
            </div>
          </div>

          {/* Report Body / List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 max-h-[calc(92vh-280px)]">
            {shiftReportLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="relative">
                  <div className="h-14 w-14 rounded-full border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 animate-spin" />
                  <Sparkles className="h-5 w-5 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">Chargement des données du shift...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Calcul des totaux et agrégation par opérateur</p>
                </div>
              </div>
            ) : shiftReportData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center border-2 border-dashed border-border/80 rounded-2xl bg-muted/10">
                <div className="h-16 w-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shadow-inner">
                  <Calendar className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-base text-foreground">Aucune activité enregistrée</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Aucun T-Code ni Unité de Manutention (HU) n'a été créé pour la date sélectionnée.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setShiftReportDate(today)
                    fetchShiftReport(today)
                  }}
                  className="mt-2 text-xs font-semibold gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" /> Revenir à aujourd'hui
                </Button>
              </div>
            ) : filteredShiftReportData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <Search className="h-8 w-8 text-muted-foreground/40" />
                <p className="font-semibold text-sm">Aucun résultat trouvé</p>
                <p className="text-xs text-muted-foreground">
                  Aucun opérateur ou T-code ne correspond au filtre « {shiftReportSearch} »
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShiftReportSearch("")}
                  className="text-xs text-purple-600 font-medium"
                >
                  Effacer le filtre
                </Button>
              </div>
            ) : (
              filteredShiftReportData.map((op) => (
                <div
                  key={op.matricule}
                  className="border border-border/80 hover:border-purple-200 dark:hover:border-purple-900 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 bg-card"
                >
                  {/* Operator Header Bar */}
                  <div className="bg-gradient-to-r from-purple-50/90 via-indigo-50/40 to-background dark:from-purple-950/40 dark:via-indigo-950/20 dark:to-card px-4 py-3 flex items-center justify-between border-b border-border/80 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-bold flex items-center justify-center shadow-xs text-xs tracking-wider">
                        {op.matricule.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-foreground">
                            {op.name ? `${op.matricule} • ${op.name}` : op.matricule}
                          </p>
                          <span className="text-[10px] font-medium bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full">
                            Opérateur
                          </span>
                          {op.sharePercentage != null && (
                            <span className="text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
                              {op.sharePercentage}% du total
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-[11px] text-muted-foreground">
                            {op.codes.length} code(s) enregistré(s)
                          </p>
                          {op.shifts?.morning && op.shifts.morning.tcodes > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 px-1.5 py-0.2 rounded">
                              <Sunrise className="h-2.5 w-2.5" /> Matin: {op.shifts.morning.tcodes}
                            </span>
                          )}
                          {op.shifts?.afternoon && op.shifts.afternoon.tcodes > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border border-sky-200 px-1.5 py-0.2 rounded">
                              <Sun className="h-2.5 w-2.5" /> Midi: {op.shifts.afternoon.tcodes}
                            </span>
                          )}
                          {op.shifts?.night && op.shifts.night.tcodes > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 px-1.5 py-0.2 rounded">
                              <Moon className="h-2.5 w-2.5" /> Nuit: {op.shifts.night.tcodes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stat Badges */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300">
                        <Package className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold">{op.totalHU}</span>
                        <span className="text-[10px] font-medium text-emerald-700/80 dark:text-emerald-400/80">HU</span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 text-purple-800 dark:text-purple-300">
                        <Barcode className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold">{op.totalCodes}</span>
                        <span className="text-[10px] font-medium text-purple-700/80 dark:text-purple-400/80">T-Codes</span>
                      </div>

                      {op.totalQty != null && op.totalQty > 0 && (
                        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-teal-800 dark:text-teal-300">
                          <Tag className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          <span className="text-xs font-semibold">{op.totalQty}</span>
                          <span className="text-[10px] font-medium text-teal-700/80 dark:text-teal-400/80">pcs</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Codes Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2 pl-4">T-CODE</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2">HU</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2">Réf. LEAR</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2 text-center">Quantité</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2 text-center">Shift</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-2 pr-4 text-right">Heure</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {op.codes.map((c, i) => (
                          <TableRow
                            key={c.code + i}
                            className={`transition-colors text-xs ${i % 2 === 0 ? 'bg-background hover:bg-muted/30' : 'bg-muted/15 hover:bg-muted/40'}`}
                          >
                            <TableCell className="py-2 pl-4">
                              <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200/70 dark:border-purple-800/50 px-2 py-0.5 rounded-md">
                                {c.code}
                              </span>
                            </TableCell>
                            <TableCell className="py-2">
                              {c.hu ? (
                                <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                                  {c.hu}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2">
                              {c.learPN ? (
                                <span className="font-medium text-foreground">{c.learPN}</span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-center">
                              {c.quantity != null ? (
                                <Badge variant="outline" className="font-mono text-[11px] font-semibold">
                                  {c.quantity}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-center">
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground">
                                {c.shift || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 pr-4 text-right text-muted-foreground font-medium">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground/70" />
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-5 py-3.5 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-medium">
                {filteredShiftReportData.length} opérateur(s) affiché(s)
              </span>
              <span>•</span>
              <span>
                Total shift : <b className="text-foreground">{shiftReportStats.totalHU} HU</b> et <b className="text-foreground">{shiftReportStats.totalCodes} T-Codes</b>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenShiftReport(false)}
              className="h-8 px-4 text-xs font-medium hover:bg-muted transition-colors cursor-pointer"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  )
}

