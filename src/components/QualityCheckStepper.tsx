import React, { useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Stepper, Step } from '@/components/ui/stepper'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'

const { useStepper, steps, utils } = defineStepper(
    {
        id: 'QualityCheck',
        title: 'Quality Check',
        description: 'Check HU & Quantity',
    },
    {
        id: 'DefectIdentification',
        title: 'Defect Identification',
        description: 'Identify Defects',
    },
    {
        id: 'TicketGeneration',
        title: 'Ticket Generation',
        description: 'Generate Ticket',
    }
)

export default function QualityCheckStepper() {
    const stepper = useStepper()
    const [huGalia, setHuGalia] = useState('')
    const [quantity, setQuantity] = useState('')
    const [location, setLocation] = useState('354D')
    const [defects, setDefects] = useState<{ barcode: string; problemCode: string; status: string }[]>([])
    const [operatorId, setOperatorId] = useState('')
    const [ticketCode, setTicketCode] = useState<string | null>(null)

    const handleReset = () => {
        setHuGalia('')
        setQuantity('')
        setLocation('354D')
        setDefects([])
        setOperatorId('')
        setTicketCode(null)
        stepper.reset()
    }

    return (
        <div className='min-h-[calc(100vh-2rem)] w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:p-8'>
            <div className='mx-auto max-w-7xl rounded-3xl bg-white/60 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/60 dark:bg-slate-900/60 dark:ring-slate-800 md:p-10'>
                <div className='mb-10 flex items-center justify-between border-b border-slate-200/60 pb-6 dark:border-slate-800'>
                    <div>
                        <h2 className='bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent'>
                            Quality Check Process
                        </h2>
                        <p className='text-muted-foreground mt-2 text-lg'>
                            Verify quality and generate tickets.
                        </p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <span className='rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'>
                            Step {utils.getIndex(stepper.current.id) + 1} of {steps.length}
                        </span>
                    </div>
                </div>

                <div className='grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]'>
                    <div className='hidden md:block'>
                        <Card className='h-full border-none shadow-none bg-transparent'>
                            <CardContent className='p-0'>
                                <Stepper orientation='vertical' activeStep={utils.getIndex(stepper.current.id)}>
                                    {stepper.all.map((step) => (
                                        <Step
                                            key={step.id}
                                            label={step.title}
                                            description={step.description}
                                        />
                                    ))}
                                </Stepper>
                            </CardContent>
                        </Card>
                    </div>

                    <div className='flex flex-col gap-6'>
                        <div className='min-h-[400px]'>
                            {stepper.switch({
                                QualityCheck: () => (
                                    <QualityCheckForm
                                        huGalia={huGalia}
                                        setHuGalia={setHuGalia}
                                        quantity={quantity}
                                        setQuantity={setQuantity}
                                        location={location}
                                        setLocation={setLocation}
                                        next={stepper.next}
                                    />
                                ),
                                DefectIdentification: () => (
                                    <DefectIdentificationForm
                                        defects={defects}
                                        setDefects={setDefects}
                                        maxQuantity={parseInt(quantity, 10) || 0}
                                        next={stepper.next}
                                    />
                                ),
                                TicketGeneration: () => (
                                    <TicketGenerationForm
                                        huGalia={huGalia}
                                        quantity={quantity}
                                        location={location}
                                        defects={defects}
                                        operatorId={operatorId}
                                        setOperatorId={setOperatorId}
                                        ticketCode={ticketCode}
                                        setTicketCode={setTicketCode}
                                    />
                                ),
                            })}
                        </div>

                        {!stepper.isLast ? (
                            <div className='flex justify-center gap-6 pt-8'>
                                <Button
                                    variant='secondary'
                                    onClick={stepper.prev}
                                    disabled={stepper.isFirst}
                                    className='w-40 rounded-full shadow-md'
                                >
                                    Back
                                </Button>
                            </div>
                        ) : (
                            <div className='flex justify-center pt-8'>
                                <Button
                                    onClick={handleReset}
                                    className='w-40 rounded-full bg-gradient-to-r from-red-500 to-pink-600 shadow-md'
                                >
                                    Reset
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function QualityCheckForm({ huGalia, setHuGalia, quantity, setQuantity, location, setLocation, next }: any) {
    const isValid = huGalia.length > 0 && quantity.length > 0 && !isNaN(Number(quantity)) && location.length > 0

    const handleNext = () => {
        if (isValid) next()
        else toast.error('Please fill all fields correctly')
    }

    return (
        <Card className='w-full rounded-2xl p-6 shadow-lg border-t-4 border-t-green-600'>
            <CardHeader>
                <CardTitle>Check HU & Quantity</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='space-y-2'>
                    <Label>HU Galia</Label>
                    <Input
                        value={huGalia}
                        onChange={(e) => setHuGalia(e.target.value)}
                        placeholder='Scan HU Galia'
                        autoComplete='off'
                    />
                </div>
                <div className='space-y-2'>
                    <Label>Number of Pieces</Label>
                    <Input
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder='Enter Quantity'
                        type='number'
                        autoComplete='off'
                    />
                </div>
                <div className='space-y-2'>
                    <Label>Location</Label>
                    <Input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder='Enter Location (e.g., Zone A)'
                        autoComplete='off'
                    />
                </div>
                <Button onClick={handleNext} className='w-full bg-green-600 hover:bg-green-700'>
                    Next
                </Button>
            </CardContent>
        </Card>
    )
}

function DefectIdentificationForm({ defects, setDefects, maxQuantity, next }: any) {
    const [barcode, setBarcode] = useState('')
    const [problemCode, setProblemCode] = useState('')

    const handleAdd = () => {
        if (!barcode || !problemCode) return
        if (defects.length >= maxQuantity) {
            toast.error(`Limit of ${maxQuantity} reached`)
            return
        }
        setDefects([...defects, { barcode, problemCode, status: 'non receptionned' }])
        setBarcode('')
        setProblemCode('')
    }

    return (
        <Card className='w-full rounded-2xl p-6 shadow-lg border-t-4 border-t-green-600'>
            <CardHeader>
                <CardTitle>Identify Defects</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='grid gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                        <Label>Piece Barcode</Label>
                        <Input
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            placeholder='Scan Piece'
                            autoComplete='off'
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label>Problem Code</Label>
                        <Input
                            value={problemCode}
                            onChange={(e) => setProblemCode(e.target.value)}
                            placeholder='Scan Problem Code'
                            autoComplete='off'
                        />
                    </div>
                </div>
                <Button onClick={handleAdd} className='w-full'>Add Defect</Button>

                <div className='mt-4 border rounded-md p-2 max-h-40 overflow-y-auto'>
                    {defects.map((d: any, i: number) => (
                        <div key={i} className='flex justify-between border-b p-2'>
                            <span>{d.barcode}</span>
                            <div className='flex gap-2'>
                                <span className='text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded'>{d.status}</span>
                                <span className='text-red-600 font-mono'>{d.problemCode}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    onClick={next}
                    className='w-full mt-4 bg-green-600 hover:bg-green-700'
                    disabled={defects.length === 0}
                >
                    Finish Identification
                </Button>
            </CardContent>
        </Card>
    )
}

function TicketGenerationForm({ huGalia, quantity, location, operatorId, setOperatorId, ticketCode, setTicketCode }: any) {

    const generateTicket = () => {
        if (!operatorId) {
            toast.error("Enter Operator ID")
            return
        }
        const code = `TKT-${Math.floor(Math.random() * 100000)}`
        setTicketCode(code)

        const doc = new jsPDF({ unit: 'cm', format: [8, 8] })
        doc.setFontSize(10)
        doc.text(`Ticket: ${code}`, 0.5, 1)
        doc.text(`HU: ${huGalia}`, 0.5, 1.5)
        doc.text(`Qty: ${quantity}`, 0.5, 2)
        doc.text(`Loc: ${location}`, 0.5, 2.5)
        doc.text(`Operator: ${operatorId}`, 0.5, 3)

        const canvas = document.createElement('canvas')
        JsBarcode(canvas, code, { format: 'CODE128', displayValue: false })
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0.5, 3.5, 6, 2)

        doc.save(`ticket-${code}.pdf`)
        toast.success('Ticket Generated')
    }

    return (
        <Card className='w-full rounded-2xl p-6 shadow-lg border-t-4 border-t-green-600'>
            <CardHeader>
                <CardTitle>Generate Ticket</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='space-y-2'>
                    <Label>Operator ID</Label>
                    <Input
                        value={operatorId}
                        onChange={(e) => setOperatorId(e.target.value)}
                        placeholder="Enter Operator ID"
                    />
                </div>

                {ticketCode ? (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <h3 className="text-xl font-bold text-green-700">Ticket Generated</h3>
                        <p className="text-2xl font-mono mt-2">{ticketCode}</p>
                    </div>
                ) : (
                    <Button onClick={generateTicket} className='w-full bg-green-600 hover:bg-green-700'>
                        Generate & Print Ticket
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
