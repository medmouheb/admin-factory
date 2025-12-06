import { useState, useEffect } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { CheckCircle, Truck, Eye, Plus, Trash2, Archive, Search, ChevronLeft, ChevronRight, RotateCcw, History } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const ITEMS_PER_PAGE = 10

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
    history?: {
        action: string
        user: string
        date: string
        details?: string
    }[]
}

export default function TransferManagement() {
    const { auth } = useAuthStore()
    const [packets, setPackets] = useState<Packet[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [newPieceBarcode, setNewPieceBarcode] = useState('')

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [dateFilter, setDateFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Pagination
    const [currentPage354D, setCurrentPage354D] = useState(1)
    const [currentPage353A, setCurrentPage353A] = useState(1)

    const fetchPackets = async () => {
        try {
            setLoading(true)
            const res = await fetch('http://localhost:8080/api/packets', { credentials: 'include' })
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

    useEffect(() => {
        fetchPackets()
    }, [])

    const handleOpenDetails = (packet: Packet) => {
        setSelectedPacket({ ...packet }) // Clone to avoid direct mutation
        setIsDialogOpen(true)
    }

    const handleSaveDetails = async () => {
        if (!selectedPacket) return
        try {
            const res = await fetch(`http://localhost:8080/api/packets/${selectedPacket.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(selectedPacket)
            })
            if (!res.ok) throw new Error('Failed to update packet')

            setPackets(prev => prev.map(p => p.id === selectedPacket.id ? selectedPacket : p))
            setIsDialogOpen(false)
            toast.success('Packet details updated')
            fetchPackets() // Refresh to ensure sync
        } catch (error) {
            console.error(error)
            toast.error('Failed to save details')
        }
    }

    const handleAddPiece = () => {
        if (!newPieceBarcode || !selectedPacket) return
        setSelectedPacket((prev) => {
            if (!prev) return null
            return {
                ...prev,
                pieces: [...(prev.pieces || []), { barcode: newPieceBarcode, status: 'OK' }],
                quantity: (prev.quantity || 0) + 1
            }
        })
        setNewPieceBarcode('')
    }

    const handleRemovePiece = (index: number) => {
        setSelectedPacket((prev) => {
            if (!prev) return null
            return {
                ...prev,
                pieces: prev.pieces.filter((_, i) => i !== index),
                quantity: Math.max(0, (prev.quantity || 0) - 1)
            }
        })
    }

    const handleStatusChange = (index: number, newStatus: string) => {
        setSelectedPacket((prev) => {
            if (!prev) return null
            const newPieces = [...prev.pieces]
            newPieces[index] = { ...newPieces[index], status: newStatus }
            return { ...prev, pieces: newPieces }
        })
    }

    const handleTransfer = async (id: string, target: '353A' | 'Stock') => {
        try {
            const res = await fetch('http://localhost:8080/api/packets/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    packetId: id,
                    target,
                    userId: auth.user?.username || 'Unknown',
                    userMatricule: auth.user?.matricule
                })
            })
            if (!res.ok) throw new Error('Transfer failed')

            toast.success(`Packet ${id} transferred to ${target}`)
            fetchPackets()
        } catch (error) {
            console.error(error)
            toast.error('Transfer failed')
        }
    }

    const handleReceive = async (id: string) => {
        try {
            const res = await fetch('http://localhost:8080/api/packets/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    packetId: id,
                    userId: auth.user?.username || 'Unknown',
                    userMatricule: auth.user?.matricule
                })
            })
            if (!res.ok) throw new Error('Receive failed')

            toast.success(`Packet ${id} received at 353A`)
            fetchPackets()
        } catch (error) {
            console.error(error)
            toast.error('Receive failed')
        }
    }

    const handleReturn = async (id: string) => {
        try {
            const res = await fetch('http://localhost:8080/api/packets/return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    packetId: id,
                    userId: auth.user?.username || 'Unknown',
                    userMatricule: auth.user?.matricule
                })
            })
            if (!res.ok) throw new Error('Return failed')

            toast.success(`Packet ${id} returned to 354D`)
            fetchPackets()
        } catch (error) {
            console.error(error)
            toast.error('Return failed')
        }
    }

    const handleAcceptReturn = async (id: string) => {
        try {
            const res = await fetch('http://localhost:8080/api/packets/accept-return', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    packetId: id,
                    userId: auth.user?.username || 'Unknown',
                    userMatricule: auth.user?.matricule
                })
            })
            if (!res.ok) throw new Error('Accept return failed')

            toast.success(`Packet ${id} return accepted at 354D`)
            fetchPackets()
        } catch (error) {
            console.error(error)
            toast.error('Accept return failed')
        }
    }

    // Filtering Logic
    const filteredPackets = packets.filter(p => {
        const matchesSearch =
            String(p.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(p.huGalia || '').toLowerCase().includes(searchTerm.toLowerCase())
        const matchesDate = dateFilter ? p.date === dateFilter : true
        const matchesStatus = statusFilter !== 'all' ? p.status === statusFilter : true

        return matchesSearch && matchesDate && matchesStatus
    })

    const packets354D = filteredPackets.filter(
        (p) => p.location === '354D' || p.location === 'Stock 354D' || (p.location === 'Transit' && (p.status === 'In Transit' || p.status === 'Returning')) || p.status === 'Returned'
    )
    const packets353A = filteredPackets.filter((p) => p.location === '353A' || p.location === 'Transit')

    // Pagination Logic
    const paginate = (items: Packet[], page: number) => {
        const start = (page - 1) * ITEMS_PER_PAGE
        return items.slice(start, start + ITEMS_PER_PAGE)
    }

    const totalPages354D = Math.ceil(packets354D.length / ITEMS_PER_PAGE)
    const totalPages353A = Math.ceil(packets353A.length / ITEMS_PER_PAGE)

    const FilterBar = () => (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-white/50 p-4 rounded-lg border">
            <div className="flex-1 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search Packet ID or HU Galia..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                />
            </div>
            <div className="w-full sm:w-[200px]">
                <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
            </div>
            <div className="w-full sm:w-[200px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Ready for Transfer">Ready for Transfer</SelectItem>
                        <SelectItem value="In Transit">In Transit</SelectItem>
                        <SelectItem value="Received">Received</SelectItem>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Returning">Returning</SelectItem>
                        <SelectItem value="Returned">Returned</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button variant="outline" onClick={() => {
                setSearchTerm('')
                setDateFilter('')
                setStatusFilter('all')
            }}>
                Clear
            </Button>
        </div>
    )

    const PaginationControls = ({ currentPage, totalPages, setPage }: any) => (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <div className="text-sm font-medium">
                Page {currentPage} of {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )

    const isEditable = selectedPacket?.status !== 'In Transit' && selectedPacket?.status !== 'Returning'

    return (
        <div className='space-y-6 p-6'>
            <div className='flex items-center justify-between'>
                <h2 className='text-3xl font-bold tracking-tight'>Transfer Management</h2>
                {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading data...</div>}
            </div>

            <FilterBar />

            <Tabs defaultValue='354D' className='w-full'>
                <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger value='354D'>Factory 354D (Sender)</TabsTrigger>
                    <TabsTrigger value='353A'>Factory 353A (Receiver)</TabsTrigger>
                </TabsList>

                {/* Factory 354D View */}
                <TabsContent value='354D'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Packets in 354D</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Packet ID</TableHead>
                                        <TableHead>HU Galia</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginate(packets354D, currentPage354D).map((packet) => (
                                        <TableRow key={packet.id}>
                                            <TableCell className='font-medium'>{packet.id}</TableCell>
                                            <TableCell>{packet.huGalia}</TableCell>
                                            <TableCell>{packet.quantity}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        packet.status === 'In Transit'
                                                            ? 'secondary'
                                                            : packet.status === 'In Stock'
                                                                ? 'outline'
                                                                : 'default'
                                                    }
                                                >
                                                    {packet.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{packet.location}</TableCell>
                                            <TableCell>{packet.date}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size='sm'
                                                        variant='ghost'
                                                        onClick={() => handleOpenDetails(packet)}
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    {packet.status === 'Ready for Transfer' && (
                                                        <>
                                                            <Button
                                                                size='sm'
                                                                onClick={() => handleTransfer(packet.id, '353A')}
                                                                className='gap-2'
                                                            >
                                                                <Truck className='h-4 w-4' />
                                                                353A
                                                            </Button>
                                                            <Button
                                                                size='sm'
                                                                variant='secondary'
                                                                onClick={() => handleTransfer(packet.id, 'Stock')}
                                                                className='gap-2'
                                                            >
                                                                <Archive className='h-4 w-4' />
                                                                Stock
                                                            </Button>
                                                        </>
                                                    )}
                                                    {packet.status === 'In Transit' && (
                                                        <span className='text-sm text-muted-foreground italic flex items-center'>
                                                            En route to 353A...
                                                        </span>
                                                    )}
                                                    {packet.status === 'Returning' && (
                                                        <Button
                                                            size='sm'
                                                            variant='outline'
                                                            onClick={() => handleAcceptReturn(packet.id)}
                                                            className='gap-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                                                        >
                                                            <CheckCircle className='h-4 w-4' />
                                                            Accept Return
                                                        </Button>
                                                    )}
                                                    {packet.status === 'Returned' && (
                                                        <span className='text-sm text-blue-600 font-medium flex items-center gap-1'>
                                                            <RotateCcw className='h-3 w-3' /> Returned
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <PaginationControls
                                currentPage={currentPage354D}
                                totalPages={totalPages354D}
                                setPage={setCurrentPage354D}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Factory 353A View */}
                <TabsContent value='353A'>
                    <Card>
                        <CardHeader>
                            <CardTitle>Packets in 353A</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Packet ID</TableHead>
                                        <TableHead>HU Galia</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginate(packets353A, currentPage353A).map((packet) => (
                                        <TableRow key={packet.id}>
                                            <TableCell className='font-medium'>{packet.id}</TableCell>
                                            <TableCell>{packet.huGalia}</TableCell>
                                            <TableCell>{packet.quantity}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        packet.status === 'Received'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className={packet.status === 'Received' ? 'bg-green-600' : ''}
                                                >
                                                    {packet.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{packet.location}</TableCell>
                                            <TableCell>{packet.date}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size='sm'
                                                        variant='ghost'
                                                        onClick={() => handleOpenDetails(packet)}
                                                    >
                                                        <Eye className='h-4 w-4' />
                                                    </Button>
                                                    {packet.status === 'In Transit' && (
                                                        <Button
                                                            size='sm'
                                                            variant='outline'
                                                            onClick={() => handleReceive(packet.id)}
                                                            className='gap-2 border-green-600 text-green-600 hover:bg-green-50'
                                                        >
                                                            <CheckCircle className='h-4 w-4' />
                                                            Accept
                                                        </Button>
                                                    )}
                                                    {packet.status === 'Received' && (
                                                        <>
                                                            <span className='text-sm text-green-600 font-medium flex items-center gap-1'>
                                                                <CheckCircle className='h-3 w-3' /> Received
                                                            </span>
                                                            {packet.pieces?.length > 0 && packet.pieces.every((p: any) => p.status === 'Retouched') && (
                                                                <Button
                                                                    size='sm'
                                                                    variant='outline'
                                                                    onClick={() => handleReturn(packet.id)}
                                                                    className='gap-2 border-orange-600 text-orange-600 hover:bg-orange-50 ml-2'
                                                                >
                                                                    <RotateCcw className='h-4 w-4' />
                                                                    Return to 354D
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    {packet.status === 'Returning' && (
                                                        <span className='text-sm text-orange-600 font-medium flex items-center gap-1'>
                                                            <Truck className='h-3 w-3' /> Returning...
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <PaginationControls
                                currentPage={currentPage353A}
                                totalPages={totalPages353A}
                                setPage={setCurrentPage353A}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Packet Details: {selectedPacket?.id}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                            <div>
                                <Label className="text-xs text-muted-foreground">HU Galia</Label>
                                <div className="font-medium">{selectedPacket?.huGalia}</div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Quantity</Label>
                                <div className="font-medium">{selectedPacket?.quantity}</div>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Status</Label>
                                <Badge>{selectedPacket?.status}</Badge>
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground">Date</Label>
                                <div className="font-medium">{selectedPacket?.date}</div>
                            </div>
                        </div>

                        {!isEditable && (
                            <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-md border border-yellow-200">
                                This packet is currently in transit or returned and cannot be modified.
                            </div>
                        )}

                        {isEditable && (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add Piece Barcode"
                                    value={newPieceBarcode}
                                    onChange={(e) => setNewPieceBarcode(e.target.value)}
                                />
                                <Button onClick={handleAddPiece} size="icon"><Plus className="h-4 w-4" /></Button>
                            </div>
                        )}

                        <div className="border rounded-md max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Barcode</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedPacket?.pieces?.map((piece: any, index: number) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-mono">{piece.barcode}</TableCell>
                                            <TableCell>
                                                <Select
                                                    value={piece.status}
                                                    onValueChange={(val) => handleStatusChange(index, val)}
                                                    disabled={!isEditable}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="OK">OK</SelectItem>
                                                        <SelectItem value="NOK">NOK</SelectItem>
                                                        <SelectItem value="Retouched">Retouched</SelectItem>
                                                        <SelectItem value="Replaced">Replaced</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleRemovePiece(index)}
                                                    disabled={!isEditable}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!selectedPacket?.pieces || selectedPacket.pieces.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                No pieces in this packet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {selectedPacket?.history && selectedPacket.history.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <History className="h-4 w-4" /> History
                            </h4>
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                                {selectedPacket.history.map((record, idx) => (
                                    <div key={idx} className="text-sm border-l-2 border-muted pl-3 py-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">{record.action}</span>
                                            <span className="text-xs text-muted-foreground">{record.date}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            by {record.user}
                                        </div>
                                        {record.details && (
                                            <div className="text-xs mt-1 italic">{record.details}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Close</Button>
                        {isEditable && <Button onClick={handleSaveDetails}>Save Changes</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
