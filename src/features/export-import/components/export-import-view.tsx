import { useState } from 'react'
import { ArrowLeft, FileSpreadsheet, ArrowRightLeft, FileUp, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Main } from '@/components/layout/main'
import { motion, AnimatePresence } from 'framer-motion'

type ViewMode = 'menu' | 'export' | 'import'

export default function ExportImportView() {
    const [mode, setMode] = useState<ViewMode>('menu')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)

    const handleExport = async (type: 'materials' | 'tickets' | 'parts') => {
        if (!startDate || !endDate) {
            toast.error('Please select both start and end dates')
            return
        }

        setIsExporting(true)
        try {
            let url = ''
            let filename = ''

            switch (type) {
                case 'materials':
                    url = `http://localhost:8080/api/materials/export?startDate=${startDate}&endDate=${endDate}`
                    filename = 'materials.xlsx'
                    break
                case 'tickets':
                    url = `http://localhost:8080/api/tickets-combined/export?startDate=${startDate}&endDate=${endDate}`
                    filename = 'tickets.xlsx'
                    break
                case 'parts':
                    url = `http://localhost:8080/api/parts/export?startDate=${startDate}&endDate=${endDate}`
                    filename = 'parts.xlsx'
                    break
            }

            // Trigger download
            const response = await fetch(url, { credentials: 'include' })
            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = downloadUrl
            a.download = filename
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(downloadUrl)
            document.body.removeChild(a)

            toast.success(`Successfully exported ${type}`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error(`Failed to export ${type}`)
        } finally {
            setIsExporting(false)
        }
    }

    const handleImport = async (type: 'materials' | 'parts', file: File) => {
        setIsImporting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const url = type === 'materials'
                ? 'http://localhost:8080/api/materials/import'
                : 'http://localhost:8080/api/parts/import'

            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            })

            if (!response.ok) throw new Error('Import failed')

            toast.success(`Successfully imported ${type}`)
        } catch (error) {
            console.error('Import error:', error)
            toast.error(`Failed to import ${type}`)
        } finally {
            setIsImporting(false)
        }
    }

    return (
        <Main fixed>
            <div className="min-h-screen bg-background/30 p-6 space-y-8">
                {/* Header */}
                <motion.div 
                   initial={{ opacity: 0, y: -20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.5 }}
                   className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 p-8 shadow-xl"
                >
                    <div className="flex items-start gap-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                        >
                            <ArrowRightLeft className="h-10 w-10 text-white" />
                        </motion.div>
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl font-bold text-white mb-2"
                            >
                                Export / Import
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-white/90 text-lg"
                            >
                                Manage data export and import operations
                            </motion.p>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {mode === 'menu' && (
                        <motion.div
                           key="menu"
                           initial={{ opacity: 0, y: 20 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -20 }}
                           transition={{ duration: 0.3 }}
                           className='flex h-full flex-col items-center justify-center gap-8 py-10'
                        >
                             <div className='grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-2'>
                                {/* Export Card */}
                                <Card
                                    className='group relative overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 border-0 bg-white/50 backdrop-blur-sm'
                                    onClick={() => setMode('export')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className='text-center space-y-4 pt-10 pb-8'>
                                        <div className="mx-auto p-4 bg-purple-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                                            <FileDown className='h-12 w-12 text-purple-600' />
                                        </div>
                                        <div>
                                            <CardTitle className='text-3xl font-bold text-purple-900'>Export Data</CardTitle>
                                            <CardDescription className="text-lg mt-2">
                                                Download reports for materials, tickets, and parts
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>

                                {/* Import Card */}
                                <Card
                                    className='group relative overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 border-0 bg-white/50 backdrop-blur-sm'
                                    onClick={() => setMode('import')}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <CardHeader className='text-center space-y-4 pt-10 pb-8'>
                                        <div className="mx-auto p-4 bg-blue-100 rounded-full group-hover:scale-110 transition-transform duration-300">
                                            <FileUp className='h-12 w-12 text-blue-600' />
                                        </div>
                                        <div>
                                            <CardTitle className='text-3xl font-bold text-blue-900'>Import Data</CardTitle>
                                            <CardDescription className="text-lg mt-2">
                                                Upload data files to update the system
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {mode !== 'menu' && (
                        <motion.div
                           key="content"
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           exit={{ opacity: 0, x: -20 }}
                           transition={{ duration: 0.3 }}
                           className="w-full max-w-5xl mx-auto"
                        >
                            <Button
                                variant='ghost'
                                className='mb-6 gap-2 hover:bg-white/50'
                                onClick={() => setMode('menu')}
                            >
                                <ArrowLeft className='h-4 w-4' />
                                Back to Menu
                            </Button>

                            <Card className={`shadow-xl border-t-4 ${mode === 'export' ? 'border-t-purple-500' : 'border-t-blue-500'}`}>
                                <CardHeader className="bg-muted/30 pb-8">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${mode === 'export' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                            {mode === 'export' ? (
                                                <FileDown className={`h-6 w-6 ${mode === 'export' ? 'text-purple-600' : 'text-blue-600'}`} />
                                            ) : (
                                                <FileUp className="h-6 w-6 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl">
                                                {mode === 'export' ? 'Export Data Configuration' : 'Import Data Upload'}
                                            </CardTitle>
                                            <CardDescription className="text-base">
                                                {mode === 'export' 
                                                    ? 'Select date range and choose data type to generate reports'
                                                    : 'Upload Excel files (.xlsx, .xls) to batch update system records'
                                                }
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    {mode === 'export' ? (
                                        <div className='space-y-8'>
                                            <div className='grid gap-6 sm:grid-cols-2 p-6 bg-muted/20 rounded-xl border border-border/50'>
                                                <div className='space-y-3'>
                                                    <Label htmlFor='startDate' className="font-semibold text-foreground">Start Date</Label>
                                                    <Input
                                                        id='startDate'
                                                        type='date'
                                                        value={startDate}
                                                        onChange={(e) => setStartDate(e.target.value)}
                                                        className="bg-white"
                                                    />
                                                </div>
                                                <div className='space-y-3'>
                                                    <Label htmlFor='endDate' className="font-semibold text-foreground">End Date</Label>
                                                    <Input
                                                        id='endDate'
                                                        type='date'
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        className="bg-white"
                                                    />
                                                </div>
                                            </div>

                                            <div className='grid gap-4 sm:grid-cols-3'>
                                                {['materials', 'tickets', 'parts'].map((type) => (
                                                    <Button
                                                        key={type}
                                                        className='h-auto flex-col gap-3 p-6 transition-all hover:scale-105 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                                                        variant='outline'
                                                        onClick={() => handleExport(type as any)}
                                                        disabled={isExporting}
                                                    >
                                                        <FileSpreadsheet className='h-8 w-8 text-muted-foreground' />
                                                        <span className="capitalize font-semibold text-lg">Export {type}</span>
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='grid gap-8 sm:grid-cols-2'>
                                            {/* Import Parts */}
                                            <div className='group space-y-4 rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-blue-500/50 hover:bg-blue-50/50'>
                                                <div className='flex items-center gap-3 font-semibold text-lg text-foreground'>
                                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                                        <FileSpreadsheet className='h-5 w-5' />
                                                    </div>
                                                    Import Parts
                                                </div>
                                                <div className='space-y-2'>
                                                    <Label htmlFor='parts-file' className="sr-only">Select File</Label>
                                                    <Input
                                                        id='parts-file'
                                                        type='file'
                                                        accept='.xlsx,.xls'
                                                        className="cursor-pointer file:cursor-pointer file:text-blue-600 file:font-semibold hover:file:bg-blue-50"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handleImport('parts', file)
                                                        }}
                                                        disabled={isImporting}
                                                    />
                                                    <p className="text-xs text-muted-foreground pt-1 pl-1">
                                                        Supported formats: .xlsx, .xls
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Import Materials */}
                                            <div className='group space-y-4 rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-green-500/50 hover:bg-green-50/50'>
                                                <div className='flex items-center gap-3 font-semibold text-lg text-foreground'>
                                                    <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                        <FileSpreadsheet className='h-5 w-5' />
                                                    </div>
                                                    Import Materials
                                                </div>
                                                <div className='space-y-2'>
                                                    <Label htmlFor='materials-file' className="sr-only">Select File</Label>
                                                    <Input
                                                        id='materials-file'
                                                        type='file'
                                                        accept='.xlsx,.xls'
                                                        className="cursor-pointer file:cursor-pointer file:text-green-600 file:font-semibold hover:file:bg-green-50"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) handleImport('materials', file)
                                                        }}
                                                        disabled={isImporting}
                                                    />
                                                    <p className="text-xs text-muted-foreground pt-1 pl-1">
                                                        Supported formats: .xlsx, .xls
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Main>
    )
}
