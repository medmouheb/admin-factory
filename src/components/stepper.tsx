// StepperFull.jsx
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from 'react'
import { defineStepper } from '@stepperize/react'
import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

/* -----------------------------
   Stepper definition
   ----------------------------- */
const { useStepper, steps, utils } = defineStepper(
  {
    id: 'LearPN',
    title: 'Check Réf Galia',
    description: 'Enter your LearPN details',
  },
  {
    id: 'complete',
    title: 'Check traceability Label',
    description: 'Checkout complete',
  }
)

/* -----------------------------
   Context: CurrentData
   ----------------------------- */
const CurrentDataContext = createContext(null)
function CurrentDataProvider({ children }) {
  const [currentData, setCurrentData] = useState({
    part: { learPN: '', tescaPN: '', desc: '', qtyPerBox: '' },
    materile: { storageUn: '', availStock: '', barcodes: [] },
    ticketCode: null,
    hasCompletedStep1: false, // ✅ flag for first step completion
  })

  return (
    <CurrentDataContext.Provider value={{ currentData, setCurrentData }}>
      {children}
    </CurrentDataContext.Provider>
  )
}
function useCurrentData() {
  const ctx = useContext(CurrentDataContext)
  if (!ctx)
    throw new Error('useCurrentData must be used inside CurrentDataProvider')
  return ctx
}

/* -----------------------------
   Main exported component
   ----------------------------- */
export default function StepperFull() {
  return (
    <CurrentDataProvider>
      <StepperInner />
    </CurrentDataProvider>
  )
}

/* -----------------------------
   Stepper UI & navigation
   ----------------------------- */
function StepperInner() {
  const stepper = useStepper()
  const { currentData, setCurrentData } = useCurrentData()
  const currentIndex = utils.getIndex(stepper.current.id)

  const handleFullReset = () => {
    setCurrentData({
      part: { learPN: '', tescaPN: '', desc: '', qtyPerBox: '' },
      materile: { storageUn: '', availStock: '', barcodes: [] },
      ticketCode: null,
      hasCompletedStep1: false,
    })
    stepper.reset()
  }

  return (
    <div className='m-4 p-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-medium'>Checkout</h2>
        <div className='flex items-center gap-2'>
          <span className='text-muted-foreground text-sm'>
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      <nav aria-label='Checkout Steps' className='group my-4'>
        <ol
          className='flex items-center justify-between gap-2'
          aria-orientation='horizontal'
        >
          {stepper.all.map((step, index, array) => (
            <React.Fragment key={step.id}>
              <li className='flex flex-shrink-0 items-center gap-4'>
                <Button
                  type='button'
                  role='tab'
                  variant={index <= currentIndex ? 'default' : 'secondary'}
                  aria-current={
                    stepper.current.id === step.id ? 'step' : undefined
                  }
                  onClick={() => stepper.goTo(step.id)}
                  className='flex size-10 items-center justify-center rounded-full'
                >
                  {index + 1}
                </Button>
                <span className='text-sm font-medium'>{step.title}</span>
              </li>
              {index < array.length - 1 && (
                <Separator
                  className={`flex-1 ${index < currentIndex ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>

      <div className='space-y-4'>
        {stepper.switch({
          LearPN: () => <MaterialAndPartForm nextFunction={stepper.next} />,
          complete: () => <CompleteComponent />,
        })}

        {!stepper.isLast ? (
          <div className='flex justify-end gap-4'>
            <Button
              variant='secondary'
              onClick={stepper.prev}
              disabled={stepper.isFirst}
            >
              Back
            </Button>
            <Button onClick={stepper.next}>
              {stepper.isLast ? 'Complete' : 'Next'}
            </Button>
          </div>
        ) : (
          <Button onClick={handleFullReset}>Reset</Button>
        )}
      </div>
    </div>
  )
}

/* -----------------------------
   MaterialAndPartForm
   ----------------------------- */
function MaterialAndPartForm({ nextFunction }) {
  const stepper = useStepper()
  const { currentData, setCurrentData } = useCurrentData()

  const [learPN, setLearPN] = useState('')
  const [storageUnit, setStorageUnit] = useState('')
  const [availStock, setAvailStock] = useState('')
  const [part, setPart] = useState({ tescaPN: '', desc: '', qtyPerBox: '' })
  const [loading, setLoading] = useState(false)

  const learPNRef = useRef(null)
  const storageRef = useRef(null)
  const availRef = useRef(null)

  // restore values on mount
  useEffect(() => {
    setLearPN(currentData.part.learPN || '')
    setPart({
      tescaPN: currentData.part.tescaPN || '',
      desc: currentData.part.desc || '',
      qtyPerBox: currentData.part.qtyPerBox || '',
    })
    setStorageUnit(currentData.materile.storageUn || '')
    setAvailStock(currentData.materile.availStock || '')
  }, [])

  // focus step
  useEffect(() => {
    if (stepper.current.id === 'LearPN')
      setTimeout(() => learPNRef.current?.focus(), 60)
  }, [stepper.current.id])

  // sync local → global
  useEffect(() => {
    setCurrentData((prev) => ({ ...prev, part: { ...prev.part, learPN } }))
  }, [learPN])
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      materile: { ...prev.materile, storageUn: storageUnit },
    }))
  }, [storageUnit])
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      materile: { ...prev.materile, availStock },
    }))
  }, [availStock])

  // fetch part
  const handleFetchPart = async () => {
    const pn = learPN.trim()
    if (!pn.toLowerCase().startsWith('p'))
      return toast.error('Lear PN must start with P')
    if (pn.length !== 16) return toast.error('Lear PN must be 16 characters')

    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8080/api/parts/lear?learPN=${pn.substring(1)}`
      )
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      const qtyStr = data.qtyPerBox != null ? String(data.qtyPerBox) : ''
      setPart({
        tescaPN: data.tescaPN || '',
        desc: data.desc || '',
        qtyPerBox: qtyStr,
      })
      setCurrentData((prev) => ({
        ...prev,
        part: {
          learPN: pn,
          tescaPN: data.tescaPN || '',
          desc: data.desc || '',
          qtyPerBox: qtyStr,
        },
      }))
      toast.success('Part loaded')
      setTimeout(() => storageRef.current?.focus(), 250)
    } catch {
      toast.error('Part not found')
      setPart({ tescaPN: '', desc: '', qtyPerBox: '' })
    } finally {
      setLoading(false)
    }
  }

  // validate storage
  const handleStorageDone = () => {
    const su = storageUnit.trim()
    if (!su.toLowerCase().startsWith('s'))
      return toast.error('HU Galia must start with s')
    if (su.length !== 10) return toast.error('HU Galia must be 10 characters')
    setCurrentData((prev) => ({
      ...prev,
      materile: { ...prev.materile, storageUn: su.substring(1) },
    }))
    toast.success('HU accepted')
    setTimeout(() => availRef.current?.focus(), 250)
  }

  // validation functions
  const isLearPNValid = () =>
    learPN.trim().length === 16 && learPN.trim().toLowerCase().startsWith('p')
  const isPartFetched = () =>
    part.tescaPN.trim() && part.desc.trim() && part.qtyPerBox.trim()
  const isStorageValid = () =>
    storageUnit.trim().length === 10 &&
    storageUnit.trim().toLowerCase().startsWith('s')
  const isAvailValid = () => /^Q\d{2}$/.test(availStock)

  // auto-next only first time
  useEffect(() => {
    if (
      isLearPNValid() &&
      isPartFetched() &&
      isStorageValid() &&
      isAvailValid() &&
      !currentData.hasCompletedStep1
    ) {
      setCurrentData((prev) => ({ ...prev, hasCompletedStep1: true }))
      toast.success('All fields complete. Proceeding...')
      setTimeout(() => nextFunction(), 600)
    }
  }, [learPN, part, storageUnit, availStock])

  const handleKeyDown = (e, type) => {
    if (e.key !== 'Enter' || loading) return
    if (type === 'part') handleFetchPart()
    if (type === 'storage') handleStorageDone()
  }

  return (
    <div className='w-full p-6'>
      <Card className='w-full rounded-2xl p-6 shadow-lg'>
        <CardHeader>
          <CardTitle className='text-2xl'>
            Part & Material Information
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* PART SECTION */}
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold'>Part Information</h3>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Lear PN</Label>
                <Input
                  className='h-12 px-4 text-lg'
                  ref={learPNRef}
                  value={learPN}
                  onChange={(e) => setLearPN(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'part')}
                  maxLength={16}
                  placeholder='Enter Lear PN (starts with P, 16 chars)'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Tesca PN</Label>
                <Input
                  className='h-12 px-4 text-lg'
                  readOnly
                  value={part.tescaPN}
                  placeholder='Auto-filled'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Description</Label>
                <Input
                  className='h-12 px-4 text-lg'
                  readOnly
                  value={part.desc}
                  placeholder='Auto-filled'
                />
              </div>
            </div>

            {/* MATERIAL SECTION */}
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold'>Material Information</h3>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>HU Galia</Label>
                <Input
                  className='h-12 px-4 text-lg'
                  ref={storageRef}
                  value={storageUnit}
                  onChange={(e) => setStorageUnit(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'storage')}
                  maxLength={10}
                  placeholder='Enter HU Galia (starts with s, 10 chars)'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Available Stock</Label>
                <Input
                  className='h-12 px-4 text-lg'
                  ref={availRef}
                  value={availStock}
                  onChange={(e) => setAvailStock(e.target.value)}
                  placeholder='Enter like "Q05"'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* -----------------------------
   CompleteComponent remains unchanged
   ----------------------------- */

function CompleteComponent() {
  const stepper = useStepper()
  const { currentData, setCurrentData } = useCurrentData()

  const qty =
    Number(String(currentData.part.qtyPerBox ?? '0').replace(/\D/g, '')) || 0
  const learPNFull = String(currentData.part.learPN || '')
  const learPN = learPNFull.substring(1, 16) || ''
  const prefix6 = learPN.slice(4, 10)

  const [barcode1, setBarcode1] = useState(learPN)
  const [barcode2, setBarcode2] = useState('')
  const [barcodesLocal, setBarcodesLocal] = useState(
    currentData.materile.barcodes || []
  )
  const [ticketCode, setTicketCode] = useState(currentData.ticketCode || null)
  const [processing, setProcessing] = useState(false)
  const [showPdfButton, setShowPdfButton] = useState(false)

  const barcode1Ref = useRef(null)
  const barcode2Ref = useRef(null)

  // Restore state
  useEffect(() => {
    setBarcode1(learPN)
    setBarcodesLocal(currentData.materile.barcodes || [])
    setTicketCode(currentData.ticketCode || null)
  }, [])

  useEffect(() => {
    if (stepper.current.id === 'complete') {
      setTimeout(() => barcode1Ref.current?.focus(), 60)
    }
  }, [stepper.current.id])

  useEffect(() => {
    setBarcode1(learPN)
  }, [learPN])

  // Keep global state in sync
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      materile: { ...prev.materile, barcodes: barcodesLocal },
      ticketCode,
    }))
  }, [barcodesLocal, ticketCode])

  // Validation
  const isBarcode2Unique = (b2) => !barcodesLocal.some((b) => b.barcode2 === b2)

  const validateBarcode2 = (value) => {
    if (!prefix6) {
      toast.error('Lear PN is missing.')
      return false
    }
    if (!value.startsWith(prefix6)) {
      toast.error(`Must start with ${prefix6}`)
      return false
    }
    if (value.length !== 13) {
      toast.error('Must be 13 chars')
      return false
    }
    if (!isBarcode2Unique(value)) {
      toast.error('Already used')
      return false
    }
    if (barcodesLocal.length >= qty) {
      toast.error('Reached required quantity')
      return false
    }
    return true
  }

  const handleAdd = () => {
    if (barcode1 !== learPN) {
      toast.error('Réf Lear must match')
      return
    }
    if (!validateBarcode2(barcode2)) return

    const newList = [...barcodesLocal, { barcode1, barcode2 }]
    setBarcodesLocal(newList)
    setBarcode2('')
    setTimeout(() => barcode1Ref.current?.focus(), 80)
  }

  // Auto-add
  useEffect(() => {
    if (barcode2.length === 13 && validateBarcode2(barcode2)) handleAdd()
  }, [barcode2])

  // Auto-generate ticket
  useEffect(() => {
    if (qty > 0 && barcodesLocal.length === qty && !ticketCode)
      generateTicketCode()
  }, [barcodesLocal])

  const generateTicketCode = async () => {
    try {
      setProcessing(true)
      const res = await fetch('http://localhost:8080/api/ticketscode/creat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suffix: learPN.slice(-5) }),
      })
      const data = await res.json()
      setTicketCode(data.code)
      toast.success('Ticket generated.')
      await bulkValidate(data.code)
    } catch (err) {
      toast.error(err.message || 'Ticket generation failed')
    } finally {
      setProcessing(false)
    }
  }

  const bulkValidate = async (code = ticketCode) => {
    try {
      setProcessing(true)
      await fetch('http://localhost:8080/api/tickets/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          barcodesLocal.map((b) => ({
            learPN: b.barcode1,
            barcode: b.barcode2,
            ticketCode: code,
          }))
        ),
      })
      toast.success(`Saved ${barcodesLocal.length} codes.`)
      setShowPdfButton(true) // show PDF button here
    } catch (err) {
      toast.error(err.message || 'Bulk save failed')
    } finally {
      setProcessing(false)
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF({ unit: 'cm', format: [5, 5] })

    let y = 0.3 // top margin

    doc.setFontSize(5)
    doc.text(`LearPN: ${learPN}`, 0.2, y)
    y += 0.4
    const canvas1 = document.createElement('canvas')
    JsBarcode(canvas1, learPN, {
      format: 'CODE128',
      width: 1,
      height: 20,
      displayValue: false,
    })
    doc.addImage(canvas1.toDataURL('image/png'), 'PNG', 0.2, y, 4.5, 1)
    y += 1.2

    doc.text(`Storage: ${currentData.materile.storageUn}`, 0.2, y)
    y += 0.4

    // Storage barcode
    const canvas2 = document.createElement('canvas')
    JsBarcode(canvas2, currentData.materile.storageUn, {
      format: 'CODE128',
      width: 1,
      height: 20,
      displayValue: false,
    })
    doc.addImage(canvas2.toDataURL('image/png'), 'PNG', 0.2, y, 4.5, 1)
    y += 1.2

    doc.text(`Ticket: ${ticketCode}`, 0.2, y)
    y += 0.4

    // Ticket barcode
    const canvas3 = document.createElement('canvas')
    JsBarcode(canvas3, ticketCode, {
      format: 'CODE128',
      width: 1,
      height: 20,
      displayValue: false,
    })
    doc.addImage(canvas3.toDataURL('image/png'), 'PNG', 0.2, y, 4.5, 1)
    y += 2

    // New page if needed
    if (y > 4) {
      doc.addPage()
      y = 0.3
    }

    doc.save('labels.pdf')
  }

  // PDF generator

  const progress = qty === 0 ? 0 : (barcodesLocal.length / qty) * 100
  const itemsLeft = Math.max(0, qty - barcodesLocal.length)

  return (
    <div className='mx-auto w-full max-w-2xl space-y-6 p-6'>
      {/* Existing Barcode Collector UI */}
      <Card className='rounded-2xl shadow-lg'>
        <CardHeader>
          <CardTitle>Barcode Collector</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Réf Lear</Label>
              <Input
                ref={barcode1Ref}
                value={barcode1}
                readOnly
                className='bg-gray-100'
                onKeyDown={(e) =>
                  e.key === 'Enter' && barcode2Ref.current?.focus()
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Traceability Code</Label>
              <Input
                ref={barcode2Ref}
                value={barcode2}
                onChange={(e) => setBarcode2(e.target.value)}
                placeholder={
                  prefix6
                    ? `Must start with ${prefix6} (13 chars)`
                    : 'LearPN missing'
                }
              />
            </div>
          </div>

          <Card className='mt-6 w-full'>
            <CardHeader>
              <CardTitle className='text-center'>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='mb-2 flex justify-between text-sm'>
                <span>
                  {itemsLeft > 0 ? `${itemsLeft} left` : 'All captured 🎉'}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className='h-3' />
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {barcodesLocal.length > 0 && (
        <Card className='rounded-2xl shadow-md'>
          <CardHeader>
            <CardTitle>Traceability Codes Added</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Lear PN</TableHead>
                  <TableHead>Traceability Code</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barcodesLocal.map((b, i) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{b.barcode1}</TableCell>
                    <TableCell>{b.barcode2}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {ticketCode && (
        <div className='mt-4 text-center'>
          <p className='text-lg font-semibold'>
            Ticket Code:{' '}
            <span className='text-primary font-mono'>{ticketCode}</span>
          </p>
        </div>
      )}

      {/* PDF button appears after bulkValidate */}
      {showPdfButton && (
        <div className='mt-4 text-center'>
          <button
            onClick={generatePDF}
            className='rounded bg-green-600 px-4 py-2 text-white'
          >
            Generate PDF
          </button>
        </div>
      )}
    </div>
  )
}
