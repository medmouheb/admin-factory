import { useState } from 'react'
import { ArrowLeft, Download, Upload, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Main } from '@/components/layout/main'

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
            <div className='mb-2 flex items-center justify-between space-y-2'>
                <div>
                    <h2 className='text-2xl font-bold tracking-tight'>Export / Import</h2>
                    <p className='text-muted-foreground'>
                        Manage data export and import operations.
                    </p>
                </div>
            </div>

            <div className='flex flex-1 flex-col gap-4 overflow-auto p-4 md:gap-8 md:p-8'>
                {mode !== 'menu' && (
                    <Button
                        variant='ghost'
                        className='w-fit gap-2'
                        onClick={() => setMode('menu')}
                    >
                        <ArrowLeft className='h-4 w-4' />
                        Back to Menu
                    </Button>
                )}

                {mode === 'menu' ? (
                    <div className='flex h-full flex-col items-center justify-center gap-8'>
                        <div className='grid w-full max-w-3xl grid-cols-1 gap-8 md:grid-cols-2'>
                            <Card
                                className='cursor-pointer transition-all hover:scale-105 hover:border-primary/50 hover:shadow-lg'
                                onClick={() => setMode('export')}
                            >
                                <CardHeader className='text-center'>
                                    <Download className='mx-auto mb-4 h-12 w-12 text-primary' />
                                    <CardTitle className='text-2xl'>Export Data</CardTitle>
                                    <CardDescription>
                                        Download reports for materials, tickets, and parts
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card
                                className='cursor-pointer transition-all hover:scale-105 hover:border-primary/50 hover:shadow-lg'
                                onClick={() => setMode('import')}
                            >
                                <CardHeader className='text-center'>
                                    <Upload className='mx-auto mb-4 h-12 w-12 text-primary' />
                                    <CardTitle className='text-2xl'>Import Data</CardTitle>
                                    <CardDescription>
                                        Upload data files to update the system
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                ) : mode === 'export' ? (
                    <Card className='mx-auto w-full max-w-4xl'>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Download className='h-6 w-6' />
                                Export Data
                            </CardTitle>
                            <CardDescription>
                                Select date range and choose data to export
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-8'>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                <div className='space-y-2'>
                                    <Label htmlFor='startDate'>Start Date</Label>
                                    <Input
                                        id='startDate'
                                        type='date'
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor='endDate'>End Date</Label>
                                    <Input
                                        id='endDate'
                                        type='date'
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className='grid gap-4 sm:grid-cols-3'>
                                <Button
                                    className='h-auto flex-col gap-2 p-6'
                                    variant='outline'
                                    onClick={() => handleExport('materials')}
                                    disabled={isExporting}
                                >
                                    <FileSpreadsheet className='h-8 w-8' />
                                    <span>Export Materials</span>
                                </Button>

                                <Button
                                    className='h-auto flex-col gap-2 p-6'
                                    variant='outline'
                                    onClick={() => handleExport('tickets')}
                                    disabled={isExporting}
                                >
                                    <FileSpreadsheet className='h-8 w-8' />
                                    <span>Export Tickets</span>
                                </Button>

                                <Button
                                    className='h-auto flex-col gap-2 p-6'
                                    variant='outline'
                                    onClick={() => handleExport('parts')}
                                    disabled={isExporting}
                                >
                                    <FileSpreadsheet className='h-8 w-8' />
                                    <span>Export Parts</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className='mx-auto w-full max-w-4xl'>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2'>
                                <Upload className='h-6 w-6' />
                                Import Data
                            </CardTitle>
                            <CardDescription>
                                Upload Excel files to import data
                            </CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-8'>
                            <div className='grid gap-8 sm:grid-cols-2'>
                                <div className='space-y-4 rounded-lg border p-4'>
                                    <div className='flex items-center gap-2 font-semibold'>
                                        <FileSpreadsheet className='h-5 w-5' />
                                        Import Parts
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='parts-file'>Select File</Label>
                                        <Input
                                            id='parts-file'
                                            type='file'
                                            accept='.xlsx,.xls'
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleImport('parts', file)
                                            }}
                                            disabled={isImporting}
                                        />
                                    </div>
                                </div>

                                <div className='space-y-4 rounded-lg border p-4'>
                                    <div className='flex items-center gap-2 font-semibold'>
                                        <FileSpreadsheet className='h-5 w-5' />
                                        Import Materials
                                    </div>
                                    <div className='space-y-2'>
                                        <Label htmlFor='materials-file'>Select File</Label>
                                        <Input
                                            id='materials-file'
                                            type='file'
                                            accept='.xlsx,.xls'
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) handleImport('materials', file)
                                            }}
                                            disabled={isImporting}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Main>
    )
}
