
import React, { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

export  function ComingSoon() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  // Popup states
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedCode, setSelectedCode] = useState("")
  const [tickets, setTickets] = useState([])
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketTotalPages, setTicketTotalPages] = useState(1)

  // ---------------------
  // Fetch Ticket Codes
  // ---------------------
  const fetchTicketCodes = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8080/api/ticketscode/ticket-code?page=${page}&limit=${limit}&search=${search}`
      )
      const json = await res.json()

      setData(json.data || [])
      setTotalPages(json.totalPages || 1)
    } catch (err) {
      console.error("Error fetching ticket codes:", err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTicketCodes()
  }, [page])

  // ---------------------
  // Fetch Tickets by ticketCode (popup)
  // ---------------------
  const fetchTicketsByCode = async (code, page = 1) => {
    try {
      const res = await fetch(
        `http://localhost:8080/api/tickets/search?page=${page}&limit=20&search=${code}`
      )
      const json = await res.json()

      setTickets(json.data || [])
      setTicketTotalPages(json.totalPages || 1)
    } catch (err) {
      console.error("Error fetching tickets:", err)
    }
  }

  // Open popup
  const handleOpenTickets = (code) => {
    setSelectedCode(code)
    setOpenDialog(true)
    setTicketPage(1)
    fetchTicketsByCode(code, 1)
  }

  // Pagination inside popup
  const handlePopupPageChange = (newPage) => {
    setTicketPage(newPage)
    fetchTicketsByCode(selectedCode, newPage)
  }

  // ---------------------
  // Main Pagination
  // ---------------------
  const nextPage = () => {
    if (page < totalPages) setPage(page + 1)
  }
  const prevPage = () => {
    if (page > 1) setPage(page - 1)
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Ticket Codes</h1>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Search ticket code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => { setPage(1); fetchTicketCodes(); }}>
          Search
        </Button>
      </div>

      <Separator />

      {/* Table */}
      <div className="rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Ticket Code</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading &&
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleOpenTickets(item.code)}
                >
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                </TableRow>
              ))}

            {loading && (
              <TableRow>
                <TableCell colSpan={2} className="text-center p-4">
                  Loading...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={prevPage} disabled={page === 1}>
          Previous
        </Button>

        <p className="text-sm">
          Page <b>{page}</b> of <b>{totalPages}</b>
        </p>

        <Button variant="outline" onClick={nextPage} disabled={page === totalPages}>
          Next
        </Button>
      </div>

      {/* ---------------------- */}
      {/* TICKETS POPUP DIALOG   */}
      {/* ---------------------- */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tickets for: {selectedCode}</DialogTitle>
          </DialogHeader>

          {/* Popup Table */}
          <div className="rounded border p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket barcode</TableHead>
                  <TableHead>learPN</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {tickets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.barcode}</TableCell>
                    <TableCell>{t.learPN}</TableCell>
                    <TableCell>{t.createdAt}</TableCell>
                  </TableRow>
                ))}

                {tickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center p-3">
                      No tickets found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Popup Pagination */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => handlePopupPageChange(ticketPage - 1)}
              disabled={ticketPage === 1}
            >
              Previous
            </Button>

            <p className="text-sm">
              Page <b>{ticketPage}</b> of <b>{ticketTotalPages}</b>
            </p>

            <Button
              variant="outline"
              onClick={() => handlePopupPageChange(ticketPage + 1)}
              disabled={ticketPage === ticketTotalPages}
            >
              Next
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

