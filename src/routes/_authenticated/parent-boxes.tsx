import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
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
    DialogFooter,
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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreHorizontal, Pencil, Trash, ChevronLeft, ChevronRight, RefreshCw, Loader2, Image as ImageIcon, Eye, AlertTriangle, Package } from 'lucide-react'
import axios from 'axios'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/parent-boxes')({
    component: ParentBoxesPage,
})

interface BoxPart {
    BoxPartCode: string
    description: string
    picture?: string
    regularDemand: number
    inventoryTotalNumber: number
    ParentBoxCode: string
}

interface ParentBox {
    ParentBoxCode: string
    description: string
    createdAt: string
    updatedAt: string
    boxParts?: BoxPart[]
}

function ParentBoxesPage() {
    const { t } = useTranslation()
    const [data, setData] = useState<ParentBox[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingBox, setEditingBox] = useState<ParentBox | null>(null)
    const [managingBox, setManagingBox] = useState<ParentBox | null>(null)

    // Delete confirm state
    const [boxToDelete, setBoxToDelete] = useState<ParentBox | null>(null)

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery)
            setPage(1)
        }, 500)
        return () => clearTimeout(handler)
    }, [searchQuery])

    const fetchParentBoxes = async () => {
        setLoading(true)
        try {
            const response = await axios.get('http://localhost:8080/api/parentbox/search', {
                withCredentials: true,
                params: {
                    q: debouncedQuery,
                    page,
                    limit: 10
                }
            })

            const { data: boxes, totalPages: total, totalItems: items } = response.data
            setData(boxes)
            setTotalPages(total)
            setTotalItems(items)
        } catch (error) {
            console.error('Error fetching parent boxes:', error)
            toast.error(t('parentBoxes.failedToUpdateParentBox'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchParentBoxes()
    }, [page, debouncedQuery])

    const handleDelete = async () => {
        if (!boxToDelete) return

        try {
            await axios.delete(`http://localhost:8080/api/parentbox/${boxToDelete.ParentBoxCode}`, {
                withCredentials: true
            })
            toast.success(t('parentBoxes.parentBoxUpdatedSuccess'))
            fetchParentBoxes()
        } catch (error) {
            console.error('Error deleting parent box:', error)
            toast.error(t('parentBoxes.failedToUpdateParentBox'))
        } finally {
            setBoxToDelete(null)
        }
    }

    const handleEdit = (box: ParentBox) => {
        setEditingBox(box)
        setIsAddDialogOpen(true)
    }

    const handleManageParts = (box: ParentBox) => {
        setManagingBox(box)
    }

    const handleAdd = () => {
        setEditingBox(null)
        setIsAddDialogOpen(true)
    }

    const onFormSuccess = () => {
        setIsAddDialogOpen(false)
        setEditingBox(null)
        fetchParentBoxes()
    }

    return (
        <Main>
            <div className='flex flex-col space-y-6 p-4 md:p-8 pt-6'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight text-primary'>{t('parentBoxes.title')}</h1>
                        <div className='flex items-center gap-2 mt-2'>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                {totalItems} {t('parentBoxes.title')}
                            </Badge>
                            <p className='text-muted-foreground text-sm'>
                                {t('parentBoxes.subtitle')}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Button onClick={handleAdd} className="shadow-lg hover:shadow-xl transition-all font-bold">
                            <Plus className='mr-2 h-4 w-4' /> {t('parentBoxes.addParentBox')}
                        </Button>
                    </div>
                </div>

                <div className='flex items-center justify-between gap-4 bg-background p-4 rounded-xl border shadow-sm'>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('parentBoxes.searchParentBoxes')}
                            className="pl-9 bg-muted/30 focus:bg-background transition-all border-none shadow-inner"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchParentBoxes} title="Refresh" className="rounded-full hover:bg-primary/5">
                        <RefreshCw className={`h-4 w-4 text-primary ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[200px] font-bold text-primary">{t('parentBoxes.parentBoxCode')}</TableHead>
                                <TableHead>{t('parentBoxes.description')}</TableHead>
                                <TableHead className="text-center">{t('parentBoxes.partsCount')}</TableHead>
                                <TableHead className="w-[100px] text-right">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center">
                                        <div className="flex flex-col justify-center items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                            <span className="font-bold uppercase tracking-widest text-[10px]">{t('parentBoxes.loadingParentBoxes')}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Search className="h-12 w-12 opacity-10" />
                                            <p className="font-bold">{t('parentBoxes.noParentBoxesFound')}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.ParentBoxCode} className="hover:bg-muted/30 transition-colors group cursor-default">
                                        <TableCell className="font-bold text-primary tracking-tight">{item.ParentBoxCode}</TableCell>
                                        <TableCell className="max-w-md truncate font-medium text-muted-foreground">{item.description}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary" className="px-4 py-0.5 rounded-full font-bold">
                                                {item.boxParts?.length || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-primary/5 rounded-full transition-all">
                                                        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-2">
                                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-2 py-1.5">{t('common.actions')}</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleManageParts(item)} className="rounded-lg py-2 focus:bg-blue-50">
                                                        <Eye className="mr-3 h-4 w-4 text-blue-500" />
                                                        <span className="font-bold">{t('parentBoxes.boxParts')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1" />
                                                    <DropdownMenuItem onClick={() => handleEdit(item)} className="rounded-lg py-2">
                                                        <Pencil className="mr-3 h-4 w-4 text-amber-500" />
                                                        <span className="font-bold">{t('common.edit')}</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setBoxToDelete(item)}
                                                        className="rounded-lg py-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                                                    >
                                                        <Trash className="mr-3 h-4 w-4 text-red-500" />
                                                        <span className="font-bold">{t('common.delete')}</span>
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

                <div className="flex items-center justify-between px-2">
                    <div className="text-sm text-muted-foreground font-medium">
                        {t('common.showing')} <span className="text-foreground font-bold">{data.length}</span> {t('common.of')} <span className="text-foreground font-bold">{totalItems}</span> {t('common.entries')}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-2 mx-4 text-sm font-bold">
                            <span className="text-muted-foreground text-[10px] uppercase tracking-tighter">{t('common.page')}</span>
                            <span className="bg-primary/10 text-primary w-7 h-7 flex items-center justify-center rounded-lg">{page}</span>
                            <span className="text-muted-foreground text-[10px] uppercase tracking-tighter">/</span>
                            <span className="w-7 h-7 flex items-center justify-center">{totalPages}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <ParentBoxFormDialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    initialData={editingBox}
                    onSuccess={onFormSuccess}
                />

                <BoxPartsManagerDialog
                    open={!!managingBox}
                    onOpenChange={(open) => !open && setManagingBox(null)}
                    parentBox={managingBox}
                    refreshParentBoxes={fetchParentBoxes}
                />

                <AlertDialog open={!!boxToDelete} onOpenChange={(open) => !open && setBoxToDelete(null)}>
                    <AlertDialogContent className="rounded-2xl border-2">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold text-red-600">{t('common.areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription className="pt-2">
                                <div className="p-4 bg-red-50 rounded-xl border border-red-100 mb-4">
                                    <p className="text-red-900 font-medium">
                                        {t('common.cannotBeUndone')} {t('parentBoxes.deleteConfirm')}
                                        <span className="font-black"> {boxToDelete?.ParentBoxCode} </span>
                                        {t('parentBoxes.andRemove')}
                                    </p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold border-2">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 rounded-xl font-bold shadow-lg shadow-red-200"
                            >
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Main>
    )
}

interface ParentBoxFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: ParentBox | null
    onSuccess: () => void
}

function ParentBoxFormDialog({ open, onOpenChange, initialData, onSuccess }: ParentBoxFormDialogProps) {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm({
        defaultValues: {
            ParentBoxCode: initialData?.ParentBoxCode || '',
            description: initialData?.description || '',
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                ParentBoxCode: initialData.ParentBoxCode,
                description: initialData.description,
            })
        } else {
            form.reset({
                ParentBoxCode: '',
                description: '',
            })
        }
    }, [initialData, form])

    const onSubmit = async (values: any) => {
        setIsSubmitting(true)
        try {
            if (initialData) {
                await axios.put(
                    `http://localhost:8080/api/parentbox/${initialData.ParentBoxCode}`,
                    { description: values.description },
                    { withCredentials: true }
                )
                toast.success(t('parentBoxes.parentBoxUpdatedSuccess'))
            } else {
                await axios.post(
                    'http://localhost:8080/api/parentbox',
                    values,
                    { withCredentials: true }
                )
                toast.success(t('parentBoxes.parentBoxAddedSuccess'))
            }
            onSuccess()
            form.reset()
        } catch (error: any) {
            console.error('Error saving parent box:', error)
            toast.error(error.response?.data?.message || t('parentBoxes.failedToAddParentBox'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-2 shadow-2xl">
                <DialogHeader className="px-8 pt-8 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
                    <DialogTitle className="text-3xl font-black text-primary tracking-tighter">
                        {initialData ? t('parentBoxes.editParentBox') : t('parentBoxes.newParentBox')}
                    </DialogTitle>
                    <p className="text-muted-foreground text-sm font-medium">
                        {initialData ? t('parentBoxes.updateParentBoxDetails') : t('parentBoxes.addNewParentBox')}
                    </p>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-8 pb-8 space-y-6">
                        <FormField
                            control={form.control}
                            name="ParentBoxCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('parentBoxes.parentBoxCode')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('parentBoxes.parentBoxCodePlaceholder')}
                                            className="h-12 rounded-xl focus-visible:ring-primary border-2"
                                            {...field}
                                            disabled={!!initialData}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t('parentBoxes.description')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('parentBoxes.descriptionPlaceholder')} className="h-12 rounded-xl focus-visible:ring-primary border-2" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-6">
                            <Button type="button" variant="ghost" className="rounded-xl h-12 px-6 font-bold" onClick={() => onOpenChange(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-10 font-bold shadow-xl shadow-primary/20">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('parentBoxes.updating')}
                                    </>
                                ) : (
                                    initialData ? t('parentBoxes.updateParentBox') : t('parentBoxes.addParentBox')
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

interface BoxPartsManagerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    parentBox: ParentBox | null
    refreshParentBoxes: () => void
}

function BoxPartsManagerDialog({ open, onOpenChange, parentBox, refreshParentBoxes }: BoxPartsManagerDialogProps) {
    const { t } = useTranslation()
    const [parts, setParts] = useState<BoxPart[]>([])
    const [loading, setLoading] = useState(false)
    const [isPartFormOpen, setIsPartFormOpen] = useState(false)
    const [editingPart, setEditingPart] = useState<BoxPart | null>(null)
    const [partToDelete, setPartToDelete] = useState<BoxPart | null>(null)

    const fetchParts = async () => {
        if (!parentBox) return
        setLoading(true)
        try {
            const response = await axios.get(`http://localhost:8080/api/parentbox/code/${parentBox.ParentBoxCode}`, {
                withCredentials: true
            })
            setParts(response.data.boxParts || [])
        } catch (error) {
            console.error('Error fetching parts:', error)
            toast.error('Failed to load parts')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && parentBox) {
            fetchParts()
        }
    }, [open, parentBox])

    const handleDeletePart = async () => {
        if (!partToDelete) return
        try {
            await axios.delete(`http://localhost:8080/api/boxpart/${partToDelete.BoxPartCode}`, {
                withCredentials: true
            })
            toast.success(t('boxParts.partDeletedSuccess'))
            fetchParts()
            refreshParentBoxes()
        } catch (error) {
            console.error('Error deleting part:', error)
            toast.error(t('boxParts.failedToDeletePart'))
        } finally {
            setPartToDelete(null)
        }
    }

    const handleEditPart = (part: BoxPart) => {
        setEditingPart(part)
        setIsPartFormOpen(true)
    }

    const handleAddPart = () => {
        setEditingPart(null)
        setIsPartFormOpen(true)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2rem] shadow-2xl border-none">
                <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-white">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-3xl font-black flex items-center gap-3 tracking-tighter">
                                <ImageIcon className="h-8 w-8 text-secondary" />
                                {t('boxParts.title')}
                            </DialogTitle>
                            <div className="flex items-center gap-2 text-primary-foreground/80 font-bold uppercase tracking-widest text-[10px]">
                                <Package className="h-3 w-3" />
                                {t('parentBoxes.parentBoxCode')}: <span className="text-white bg-white/20 px-2 py-0.5 rounded-sm">{parentBox?.ParentBoxCode}</span>
                            </div>
                        </div>
                        <Button onClick={handleAddPart} variant="secondary" className="rounded-full h-12 px-6 font-black shadow-lg shadow-black/20 hover:scale-105 transition-transform">
                            <Plus className="h-5 w-5 mr-2" />
                            {t('boxParts.addPart')}
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-8 bg-muted/20 scrollbar-hide">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-80 gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                            <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">Syncing Inventory...</p>
                        </div>
                    ) : parts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-80 border-4 border-dashed rounded-[2rem] bg-background/50 gap-6 transition-all">
                            <div className="p-6 bg-muted rounded-full">
                                <ImageIcon className="h-16 w-16 text-muted-foreground opacity-20" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-2xl font-black text-muted-foreground/50 tracking-tight">{t('boxParts.noPartsFound')}</p>
                                <p className="text-sm text-muted-foreground/40 font-medium">{t('boxParts.subtitle')}</p>
                            </div>
                            <Button variant="outline" onClick={handleAddPart} className="rounded-full border-2 font-bold p-6">
                                <Plus className="h-5 w-5 mr-2" />
                                {t('boxParts.addPart')}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {parts.map((part) => {
                                const isLowStock = part.inventoryTotalNumber < part.regularDemand;
                                return (
                                    <div key={part.BoxPartCode} className="group bg-card border-2 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex flex-col">
                                        <div className="aspect-video bg-muted relative overflow-hidden flex-shrink-0">
                                            {part.picture ? (
                                                <img
                                                    src={`http://localhost:8080/api/boxpart/picture/${part.BoxPartCode}`}
                                                    alt={part.BoxPartCode}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                                    crossOrigin="use-credentials"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                    <ImageIcon className="h-16 w-16" />
                                                </div>
                                            )}
                                            {isLowStock && (
                                                <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    LOW STOCK
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                                                <div className="flex gap-2 w-full">
                                                    <Button variant="secondary" size="sm" className="flex-1 rounded-xl font-bold" onClick={() => handleEditPart(part)}>
                                                        <Pencil className="h-3.5 w-3.5 mr-2" /> {t('common.edit')}
                                                    </Button>
                                                    <Button variant="destructive" size="sm" className="flex-1 rounded-xl font-bold" onClick={() => setPartToDelete(part)}>
                                                        <Trash className="h-3.5 w-3.5 mr-2" /> {t('common.delete')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex-1">
                                                <h4 className="font-black text-lg text-primary tracking-tighter leading-none mb-2 truncate" title={part.BoxPartCode}>
                                                    {part.BoxPartCode}
                                                </h4>
                                                <p className="text-xs text-muted-foreground font-medium line-clamp-2" title={part.description}>
                                                    {part.description}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t-2 border-dashed">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('boxParts.inventory')}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xl font-black tracking-tighter ${isLowStock ? 'text-red-600' : 'text-foreground'}`}>
                                                            {part.inventoryTotalNumber}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('boxParts.regularDemand')}</p>
                                                    <p className="text-xl font-black tracking-tighter text-muted-foreground/60">{part.regularDemand}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-background border-t flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] opacity-40">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Live Inventory Feed
                    </div>
                    <Button variant="ghost" className="rounded-xl font-black uppercase text-xs tracking-widest" onClick={() => onOpenChange(false)}>
                        {t('common.close')}
                    </Button>
                </DialogFooter>

                <BoxPartFormDialog
                    open={isPartFormOpen}
                    onOpenChange={setIsPartFormOpen}
                    initialData={editingPart}
                    parentBoxCode={parentBox?.ParentBoxCode || ''}
                    onSuccess={() => {
                        setIsPartFormOpen(false)
                        fetchParts()
                        refreshParentBoxes()
                    }}
                />

                <AlertDialog open={!!partToDelete} onOpenChange={(open) => !open && setPartToDelete(null)}>
                    <AlertDialogContent className="rounded-[2rem] border-4">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black text-red-600 tracking-tighter italic uppercase">{t('common.areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription className="pt-2">
                                <div className="flex flex-col gap-4 items-center p-6 bg-red-50 rounded-[1.5rem] border-2 border-red-200">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-red-200/50">
                                        <Trash className="h-10 w-10 text-red-600" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-red-950 uppercase text-[10px] tracking-widest mb-1 opacity-50">Permanent Deletion</p>
                                        <p className="text-2xl font-black text-red-600 tracking-tighter">{partToDelete?.BoxPartCode}</p>
                                        <p className="text-red-700/60 font-bold text-xs mt-3 leading-tight">{t('boxParts.deleteConfirm')}</p>
                                    </div>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-3">
                            <AlertDialogCancel className="rounded-2xl font-black h-12 flex-1 border-2">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeletePart}
                                className="bg-red-600 hover:bg-red-700 rounded-2xl font-black h-12 flex-1 shadow-xl shadow-red-200"
                            >
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DialogContent>
        </Dialog>
    )
}

interface BoxPartFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData: BoxPart | null
    parentBoxCode: string
    onSuccess: () => void
}

function BoxPartFormDialog({ open, onOpenChange, initialData, parentBoxCode, onSuccess }: BoxPartFormDialogProps) {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm({
        defaultValues: {
            BoxPartCode: initialData?.BoxPartCode || '',
            description: initialData?.description || '',
            regularDemand: initialData?.regularDemand || 0,
            inventoryTotalNumber: initialData?.inventoryTotalNumber || 0,
            ParentBoxCode: parentBoxCode,
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                BoxPartCode: initialData.BoxPartCode,
                description: initialData.description,
                regularDemand: initialData.regularDemand,
                inventoryTotalNumber: initialData.inventoryTotalNumber,
                ParentBoxCode: parentBoxCode,
            })
            if (initialData.BoxPartCode) {
                setPreviewUrl(`http://localhost:8080/api/boxpart/picture/${initialData.BoxPartCode}`)
            }
        } else {
            form.reset({
                BoxPartCode: '',
                description: '',
                regularDemand: 0,
                inventoryTotalNumber: 0,
                ParentBoxCode: parentBoxCode,
            })
            setPreviewUrl(null)
        }
    }, [initialData, form, parentBoxCode, open])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const onSubmit = async (values: any) => {
        setIsSubmitting(true)
        const formData = new FormData()
        formData.append('BoxPartCode', values.BoxPartCode)
        formData.append('description', values.description)
        formData.append('regularDemand', String(values.regularDemand))
        formData.append('inventoryTotalNumber', String(values.inventoryTotalNumber))
        formData.append('ParentBoxCode', values.ParentBoxCode)

        const file = fileInputRef.current?.files?.[0]
        if (file) {
            formData.append('picture', file)
        }

        try {
            if (initialData) {
                await axios.put(
                    `http://localhost:8080/api/boxpart/${initialData.BoxPartCode}`,
                    formData,
                    { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
                )
                toast.success(t('boxParts.partUpdatedSuccess'))
            } else {
                await axios.post(
                    'http://localhost:8080/api/boxpart',
                    formData,
                    { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
                )
                toast.success(t('boxParts.partAddedSuccess'))
            }
            onSuccess()
        } catch (error: any) {
            console.error('Error saving part:', error)
            toast.error(error.response?.data?.message || t('boxParts.failedToAddPart'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] overflow-hidden rounded-[2.5rem] p-0 border-none shadow-2xl">
                <DialogHeader className="p-8 pb-4 bg-gradient-to-b from-primary/10 to-transparent">
                    <DialogTitle className="text-3xl font-black text-primary tracking-tighter">
                        {initialData ? t('boxParts.editPart') : t('boxParts.addPart')}
                    </DialogTitle>
                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest opacity-60">Box Configuration Wizard</p>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-5">
                                <FormField
                                    control={form.control}
                                    name="BoxPartCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('boxParts.partCode')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g. BP-X90"
                                                    {...field}
                                                    disabled={!!initialData}
                                                    className="h-12 rounded-2xl border-2 font-bold focus-visible:ring-primary"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('boxParts.description')}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Describe this part..." {...field} className="h-12 rounded-2xl border-2 font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="regularDemand"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('boxParts.regularDemand')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                        className="h-12 text-center font-black text-lg bg-muted/30 border-none rounded-2xl"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="inventoryTotalNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t('boxParts.inventory')}</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                        className="h-12 text-center font-black text-lg bg-primary/5 text-primary border-none rounded-2xl"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <FormLabel className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground block">{t('boxParts.picture')}</FormLabel>
                                <div
                                    className="w-full aspect-square bg-muted/30 rounded-[2rem] border-4 border-dashed border-primary/20 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-500"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {previewUrl ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            crossOrigin="use-credentials"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-5 bg-background shadow-xl rounded-full">
                                                <ImageIcon className="h-10 w-10 text-primary opacity-40" />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{t('boxParts.uploadPicture')}</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-primary/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                                        <ImageIcon className="h-8 w-8 text-white mb-2" />
                                        <p className="text-white text-xs font-black uppercase tracking-[0.2em]">{previewUrl ? t('boxParts.changePicture') : t('boxParts.uploadPicture')}</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-8 mt-4 border-t-2 border-dashed">
                            <Button type="button" variant="ghost" className="rounded-2xl h-14 px-8 font-black uppercase text-xs tracking-widest" onClick={() => onOpenChange(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-2xl h-14 px-12 font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/40 hover:scale-105 transition-all">
                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : initialData ? t('boxParts.editPart') : t('boxParts.addPart')}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
