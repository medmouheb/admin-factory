import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus, Search, MoreHorizontal, Trash, ChevronLeft, ChevronRight, RefreshCw, Loader2, X, ArrowUpRight, ArrowDownRight, History, Package } from 'lucide-react'
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
import { useForm, useFieldArray } from 'react-hook-form'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/box-movements')({
    component: BoxMovementsPage,
})

interface BoxMovement {
    id: string
    ParentBoxCode: string
    movementType: 'add' | 'subtract'
    BoxPartsDemanded: Array<{
        BoxPartCode: string
        demand: number
    }>
    createdAt: string
    updatedAt: string
}

interface ParentBox {
    ParentBoxCode: string
    description: string
}

interface BoxPart {
    BoxPartCode: string
    description: string
    inventoryTotalNumber: number
    regularDemand: number
}

function BoxMovementsPage() {
    const { t } = useTranslation()
    const [data, setData] = useState<BoxMovement[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    // Delete confirm state
    const [movementToDelete, setMovementToDelete] = useState<BoxMovement | null>(null)

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery)
            setPage(1)
        }, 500)
        return () => clearTimeout(handler)
    }, [searchQuery])

    const fetchMovements = async () => {
        setLoading(true)
        try {
            const response = await axios.get('http://localhost:8080/api/boxmovement/search', {
                withCredentials: true,
                params: {
                    q: debouncedQuery,
                    page,
                    limit: 10
                }
            })

            const { data: movements, totalPages: total, totalItems: items } = response.data
            setData(movements)
            setTotalPages(total)
            setTotalItems(items)
        } catch (error) {
            console.error('Error fetching movements:', error)
            toast.error(t('boxMovements.failedToCreateMovement'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMovements()
    }, [page, debouncedQuery])

    const handleDelete = async () => {
        if (!movementToDelete) return

        try {
            await axios.delete(`http://localhost:8080/api/boxmovement/${movementToDelete.id}`, {
                withCredentials: true
            })
            toast.success(t('boxMovements.movementUpdatedSuccess'))
            fetchMovements()
        } catch (error) {
            console.error('Error deleting movement:', error)
            toast.error(t('boxMovements.failedToUpdateMovement'))
        } finally {
            setMovementToDelete(null)
        }
    }

    const handleAdd = () => {
        setIsAddDialogOpen(true)
    }

    const onFormSuccess = () => {
        setIsAddDialogOpen(false)
        fetchMovements()
    }

    return (
        <Main>
            <div className='flex flex-col space-y-6 p-4 md:p-8 pt-6'>
                <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                    <div>
                        <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
                            <History className="h-8 w-8 text-primary" />
                            {t('boxMovements.title')}
                        </h1>
                        <div className='flex items-center gap-2 mt-2'>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {totalItems} {t('boxMovements.title')}
                            </Badge>
                            <p className='text-muted-foreground'>
                                {t('boxMovements.subtitle')}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Button onClick={handleAdd} className="shadow-lg hover:shadow-xl transition-all font-bold">
                            <Plus className='mr-2 h-4 w-4' /> {t('boxMovements.addMovement')}
                        </Button>
                    </div>
                </div>

                <div className='flex items-center justify-between gap-4 bg-background p-4 rounded-lg border shadow-sm'>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('boxMovements.searchMovements')}
                            className="pl-9 bg-muted/50 focus:bg-background transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchMovements} title="Refresh">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[180px] font-bold text-primary">{t('boxMovements.movementId')}</TableHead>
                                <TableHead>{t('boxMovements.parentBoxCode')}</TableHead>
                                <TableHead>{t('boxMovements.movementType')}</TableHead>
                                <TableHead className="text-center">{t('boxMovements.partsAffected')}</TableHead>
                                <TableHead>{t('boxMovements.createdAt')}</TableHead>
                                <TableHead className="w-[80px] text-right">{t('common.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="font-medium">{t('boxMovements.loadingMovements')}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <History className="h-8 w-8 opacity-20" />
                                            {t('boxMovements.noMovementsFound')}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors group">
                                        <TableCell className="font-bold">{item.id}</TableCell>
                                        <TableCell className="font-medium text-primary uppercase text-xs tracking-wider">{item.ParentBoxCode}</TableCell>
                                        <TableCell>
                                            <Badge className={
                                                item.movementType === 'add'
                                                    ? 'bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20'
                                                    : 'bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20'
                                            }>
                                                {item.movementType === 'add' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                                                {item.movementType === 'add' ? t('boxMovements.add').split(' ')[0] : t('boxMovements.subtract').split(' ')[0]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="secondary">
                                                {item.BoxPartsDemanded.length} {t('parentBoxes.boxParts')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm font-medium">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => setMovementToDelete(item)}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        {t('common.delete')}
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
                    <div className="text-sm text-muted-foreground">
                        {t('common.showing')} <span className="font-semibold text-foreground">{data.length}</span> {t('common.of')} <span className="font-semibold text-foreground">{totalItems}</span> {t('common.entries')}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium">
                            {t('common.page')} {page} {t('common.of')} {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <MovementFormDialog
                    open={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    onSuccess={onFormSuccess}
                />

                <AlertDialog open={!!movementToDelete} onOpenChange={(open) => !open && setMovementToDelete(null)}>
                    <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">{t('common.areYouSure')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                <div className="flex flex-col gap-4 mt-4 p-4 bg-red-50 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <History className="h-8 w-8 text-red-600" />
                                        <div>
                                            <p className="font-bold text-red-950 uppercase text-[10px] tracking-widest">Reversing Movement</p>
                                            <p className="text-red-900 font-bold">{movementToDelete?.id}</p>
                                        </div>
                                    </div>
                                    <p className="text-red-700 text-sm">{t('boxMovements.deleteConfirm')} {t('boxMovements.andReverse')}</p>
                                </div>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-2">
                            <AlertDialogCancel className="rounded-xl font-bold">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-red-600 hover:bg-red-700 rounded-xl font-bold"
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

interface MovementFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

function MovementFormDialog({ open, onOpenChange, onSuccess }: MovementFormDialogProps) {
    const { t } = useTranslation()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [parentBoxes, setParentBoxes] = useState<ParentBox[]>([])
    const [availableParts, setAvailableParts] = useState<BoxPart[]>([])
    const [loadingParts, setLoadingParts] = useState(false)

    const form = useForm({
        defaultValues: {
            id: `BM-${Date.now()}`,
            ParentBoxCode: '',
            movementType: 'add' as 'add' | 'subtract',
            BoxPartsDemanded: [{ BoxPartCode: '', demand: 0 }],
        },
    })

    const selectedParentBox = form.watch('ParentBoxCode')

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'BoxPartsDemanded',
    })

    useEffect(() => {
        if (open) {
            axios.get('http://localhost:8080/api/parentbox', { withCredentials: true })
                .then(res => setParentBoxes(res.data))
                .catch(err => console.error('Error fetching parent boxes:', err))

            form.reset({
                id: `BM-${Date.now()}`,
                ParentBoxCode: '',
                movementType: 'add',
                BoxPartsDemanded: [{ BoxPartCode: '', demand: 1 }],
            })
        }
    }, [open, form])

    useEffect(() => {
        if (selectedParentBox) {
            setLoadingParts(true)
            axios.get(`http://localhost:8080/api/parentbox/code/${selectedParentBox}`, { withCredentials: true })
                .then(res => {
                    setAvailableParts(res.data.boxParts || [])
                })
                .catch(err => {
                    console.error('Error fetching box parts:', err)
                    toast.error('Could not load parts for this box')
                })
                .finally(() => setLoadingParts(false))
        } else {
            setAvailableParts([])
        }
    }, [selectedParentBox])

    const onSubmit = async (values: any) => {
        setIsSubmitting(true)
        try {
            await axios.post(
                'http://localhost:8080/api/boxmovement',
                values,
                { withCredentials: true }
            )
            toast.success(t('boxMovements.movementCreatedSuccess'))
            onSuccess()
            form.reset()
        } catch (error: any) {
            console.error('Error creating movement:', error)
            toast.error(error.response?.data?.message || t('boxMovements.failedToCreateMovement'))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-2xl shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-r from-blue-50 to-background border-b">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-primary">
                        <Plus className="h-6 w-6" />
                        {t('boxMovements.newMovement')}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">{t('boxMovements.createNewMovement')}</p>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/5">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-background rounded-xl border shadow-sm">
                                <FormField
                                    control={form.control}
                                    name="id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold flex items-center gap-2">
                                                <History className="h-4 w-4 text-muted-foreground" />
                                                {t('boxMovements.movementId')}
                                            </FormLabel>
                                            <FormControl>
                                                <Input className="h-10 bg-muted/20 border-0 focus-visible:ring-1" placeholder={t('boxMovements.movementIdPlaceholder')} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="movementType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">{t('boxMovements.movementType')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-10">
                                                        <SelectValue placeholder={t('boxMovements.selectMovementType')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="add" className="text-green-600 font-bold">{t('boxMovements.add')}</SelectItem>
                                                    <SelectItem value="subtract" className="text-red-600 font-bold">{t('boxMovements.subtract')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ParentBoxCode"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="font-bold flex items-center gap-2">
                                                <Package className="h-4 w-4 text-muted-foreground" />
                                                {t('boxMovements.parentBoxCode')}
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-11 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                                                        <SelectValue placeholder={t('boxMovements.selectParentBox')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="max-h-64">
                                                    {parentBoxes.map((box) => (
                                                        <SelectItem key={box.ParentBoxCode} value={box.ParentBoxCode} className="py-3 px-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-primary">{box.ParentBoxCode}</span>
                                                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{box.description}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <History className="h-4 w-4" />
                                        {t('boxMovements.partsAffected')}
                                    </h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-full border-primary/50 text-primary hover:bg-primary/10"
                                        onClick={() => append({ BoxPartCode: '', demand: 1 })}
                                        disabled={!selectedParentBox}
                                    >
                                        <Plus className="h-3 w-3 mr-2" />
                                        {t('boxMovements.addPart')}
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-3 items-end group animate-in slide-in-from-left-2 duration-300">
                                            <FormField
                                                control={form.control}
                                                name={`BoxPartsDemanded.${index}.BoxPartCode`}
                                                render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <Select onValueChange={(val) => {
                                                            field.onChange(val);
                                                            const part = availableParts.find(p => p.BoxPartCode === val);
                                                            if (part) {
                                                                form.setValue(`BoxPartsDemanded.${index}.demand`, part.regularDemand);
                                                            }
                                                        }} value={field.value} disabled={loadingParts}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-11 shadow-sm">
                                                                    <SelectValue placeholder={t('boxMovements.boxPartCode')} />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="max-h-64">
                                                                {availableParts.map(part => (
                                                                    <SelectItem key={part.BoxPartCode} value={part.BoxPartCode}>
                                                                        <div className="flex justify-between items-center w-full min-w-[200px]">
                                                                            <span className="font-bold">{part.BoxPartCode}</span>
                                                                            <Badge variant="outline" className="text-[10px] ml-4 bg-muted/50">STOCK: {part.inventoryTotalNumber}</Badge>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`BoxPartsDemanded.${index}.demand`}
                                                render={({ field }) => (
                                                    <FormItem className="w-24">
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                className="h-11 text-center font-bold"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                {!selectedParentBox && (
                                    <p className="text-xs text-center text-muted-foreground italic border-2 border-dashed p-4 rounded-xl">
                                        {t('boxMovements.selectParentBox')} to select parts
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t font-bold">
                                <Button type="button" variant="ghost" className="rounded-xl px-8" onClick={() => onOpenChange(false)}>
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="rounded-xl min-w-[160px] shadow-lg shadow-primary/20">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('boxMovements.createMovement')}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
