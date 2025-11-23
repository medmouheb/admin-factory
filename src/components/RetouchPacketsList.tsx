import { useEffect, useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface Piece {
    barcode: string
    status: string
}

interface Packet {
    id: string
    huGalia: string
    location: string
    status: string
    quantity: number
    date: string
    pieces: Piece[]
}

const ITEMS_PER_PAGE = 5

export default function RetouchPacketsList() {
    const [packets, setPackets] = useState<Packet[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        const fetchPackets = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/packets')
                if (!res.ok) throw new Error('Failed to fetch packets')
                const data = await res.json()
                setPackets(data)
            } catch (error) {
                console.error(error)
                toast.error('Failed to load packets')
            } finally {
                setLoading(false)
            }
        }

        fetchPackets()
    }, [])

    // Filter Logic
    const filteredPackets = packets.filter(packet => {
        const searchLower = searchTerm.toLowerCase()
        return (
            String(packet.id).toLowerCase().includes(searchLower) ||
            String(packet.huGalia || '').toLowerCase().includes(searchLower) ||
            String(packet.status).toLowerCase().includes(searchLower)
        )
    })

    // Pagination Logic
    const totalPages = Math.ceil(filteredPackets.length / ITEMS_PER_PAGE)
    const paginatedPackets = filteredPackets.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
        }
    }

    const handleViewDetails = (packet: Packet) => {
        setSelectedPacket(packet)
        setIsDialogOpen(true)
    }

    if (loading) {
        return <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading packets...</div>
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 animate-gradient-xy">
            <Card className='w-full max-w-6xl shadow-2xl border-t-4 border-t-blue-600 transition-all duration-300 hover:shadow-3xl bg-white/80 backdrop-blur-sm'>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                    <div>
                        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            HuGalia Management Overview
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Manage and track your HuGalia packets efficiently.</p>
                    </div>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Ticket / HU..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1) // Reset to first page on search
                            }}
                            className="pl-10 h-10 transition-all focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow>
                                    <TableHead className="font-semibold">Ticket / HU</TableHead>
                                    <TableHead className="font-semibold">Location</TableHead>
                                    <TableHead className="font-semibold">Qty</TableHead>
                                    <TableHead className="font-semibold">Pieces Preview</TableHead>
                                    <TableHead className="font-semibold">HU Status</TableHead>
                                    <TableHead className="font-semibold">Date</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPackets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center gap-2">
                                            <Search className="h-8 w-8 text-muted-foreground/50" />
                                            <span>No packets found matching your criteria</span>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPackets.map((packet, index) => (
                                        <TableRow
                                            key={packet.id}
                                            className="group transition-colors hover:bg-blue-50/30 data-[state=selected]:bg-muted"
                                        >
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className='font-mono font-bold text-blue-600 group-hover:text-blue-700 transition-colors'>{packet.id}</span>
                                                    <span className='text-xs text-muted-foreground font-medium'>{packet.huGalia}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                                                    {packet.location}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-700">{packet.quantity}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-medium text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                                                        {packet.pieces?.length || 0} items
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        packet.status === 'Retouched'
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
                                                            : packet.status === 'In Transit'
                                                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
                                                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'
                                                    }
                                                >
                                                    {packet.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground font-medium">
                                                {new Date(packet.date).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewDetails(packet)}
                                                    className="hover:bg-blue-100 hover:text-blue-700 transition-all duration-200"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-6 px-2">
                        <div className="text-sm text-muted-foreground font-medium">
                            Showing <span className="text-foreground">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to <span className="text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredPackets.length)}</span> of <span className="text-foreground">{filteredPackets.length}</span> entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-md">
                                Page {currentPage} of {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>

                {/* Details Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0 gap-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="p-6 pb-4 border-b bg-slate-50/50">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                Packet Details
                                <Badge variant="outline" className="text-lg font-mono text-blue-600 border-blue-200 bg-blue-50 px-3 py-1">
                                    {selectedPacket?.id}
                                </Badge>
                            </DialogTitle>
                        </DialogHeader>

                        {selectedPacket && (
                            <div className="p-6 space-y-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">HU Galia</p>
                                        <p className="font-bold text-lg text-slate-800">{selectedPacket.huGalia}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Location</p>
                                        <p className="font-bold text-lg text-slate-800">{selectedPacket.location}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                                        <Badge variant="secondary" className="font-semibold">{selectedPacket.status}</Badge>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Quantity</p>
                                        <p className="font-bold text-lg text-slate-800">{selectedPacket.quantity}</p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
                                        Pieces Content
                                        <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                                            {selectedPacket.pieces?.length || 0} items
                                        </span>
                                    </h3>
                                    <div className="border rounded-xl overflow-hidden shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="w-16 text-center font-semibold">#</TableHead>
                                                    <TableHead className="font-semibold">Barcode</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedPacket.pieces?.map((piece, idx) => (
                                                    <TableRow key={idx} className="hover:bg-slate-50/50">
                                                        <TableCell className="text-center text-muted-foreground font-medium text-xs">
                                                            {idx + 1}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm font-medium text-slate-700">
                                                            {piece.barcode}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    ['ok', 'controlled'].includes(piece.status.toLowerCase())
                                                                        ? 'text-green-700 border-green-200 bg-green-50 font-semibold'
                                                                        : piece.status.toLowerCase() === 'retouched'
                                                                            ? 'text-yellow-700 border-yellow-200 bg-yellow-50 font-semibold'
                                                                            : 'text-red-700 border-red-200 bg-red-50 font-semibold'
                                                                }
                                                            >
                                                                {piece.status || 'Not Retouched'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </Card>
        </div>
    )
}
