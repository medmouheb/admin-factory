// StepperFull.jsx
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from 'react'
import { defineStepper } from '@stepperize/react'
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
   Global stepper
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
   CurrentData context (in-file)
   ----------------------------- */
const CurrentDataContext = createContext(null)
function CurrentDataProvider({ children }) {
  const [currentData, setCurrentData] = useState({
    part: {
      learPN: '',
      tescaPN: '',
      desc: '',
      qtyPerBox: '',
    },
    materile: {
      storageUn: '',
      availStock: '',
      barcodes: [],
    },
    ticketCode: null,
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
   Main Stepper component (single-file)
   ----------------------------- */
export default function StepperFull() {
  return (
    <CurrentDataProvider>
      <StepperInner />
    </CurrentDataProvider>
  )
}

function StepperInner() {
  const stepper = useStepper()
  const { currentData, setCurrentData } = useCurrentData()
  const currentIndex = utils.getIndex(stepper.current.id)

  // Reset handler: clear global data and reset stepper
  const handleFullReset = () => {
    setCurrentData({
      part: { learPN: '', tescaPN: '', desc: '', qtyPerBox: '' },
      materile: { storageUn: '', availStock: '', barcodes: [] },
      ticketCode: null,
    })
    stepper.reset()
  }

  return (
    <div className="m-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Checkout</h2>

        <pre className="hidden md:block max-w-md overflow-auto text-xs">
          {JSON.stringify(currentData, null, 2)}
        </pre>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      <nav aria-label="Checkout Steps" className="group my-4">
        <ol
          className="flex items-center justify-between gap-2"
          aria-orientation="horizontal"
        >
          {stepper.all.map((step, index, array) => (
            <React.Fragment key={step.id}>
              <li className="flex flex-shrink-0 items-center gap-4">
                <Button
                  type="button"
                  role="tab"
                  variant={index <= currentIndex ? 'default' : 'secondary'}
                  aria-current={stepper.current.id === step.id ? 'step' : undefined}
                  onClick={() => stepper.goTo(step.id)}
                  className="flex size-10 items-center justify-center rounded-full"
                >
                  {index + 1}
                </Button>
                <span className="text-sm font-medium">{step.title}</span>
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

      <div className="space-y-4">
        {stepper.switch({
          LearPN: () => <MaterialAndPartForm nextFunction={stepper.next} />,
          complete: () => <CompleteComponent />,
        })}

        {!stepper.isLast ? (
          <div className="flex justify-end gap-4">
            <Button
              variant="secondary"
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
   - live updates to currentData
   - focus flow: learPN -> storageUnit -> availStock -> next
   - LearPN rules: 16 chars, starts with P, api call with substring(1)
   - restores values from global on mount so fields persist when navigating
   ----------------------------- */
function MaterialAndPartForm({ nextFunction }) {
  const { currentData, setCurrentData } = useCurrentData()

  const [learPN, setLearPN] = useState('')
  const [storageUnit, setStorageUnit] = useState('')
  const [availStock, setAvailStock] = useState('')

  const [part, setPart] = useState({ tescaPN: '', desc: '', qtyPerBox: '' })
  const [loading, setLoading] = useState(false)

  const learPNRef = useRef(null)
  const storageRef = useRef(null)
  const availRef = useRef(null)

  // restore saved global data when this step mounts
  useEffect(() => {
    setLearPN(currentData.part.learPN || '')
    setPart({
      tescaPN: currentData.part.tescaPN || '',
      desc: currentData.part.desc || '',
      qtyPerBox: currentData.part.qtyPerBox || '',
    })
    // storageUn in global could be saved without the leading 's' per your logic;
    // show the stored value (if you store without 's', keep it; if you stored with 's', adjust)
    setStorageUnit(currentData.materile.storageUn || '')
    setAvailStock(currentData.materile.availStock || '')
    // focus after restore
    setTimeout(() => learPNRef.current?.focus(), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // focus on first render (already ensured by restore effect, but keep fallback)
  useEffect(() => {
    learPNRef.current?.focus()
  }, [])

  // live update learPN into global currentData as user types
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      part: {
        ...prev.part,
        learPN,
      },
    }))
  }, [learPN, setCurrentData])

  // live update storageUnit into global currentData as user types
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      materile: {
        ...prev.materile,
        storageUn: storageUnit,
      },
    }))
  }, [storageUnit, setCurrentData])

  // live update availStock into global currentData as user types
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      materile: {
        ...prev.materile,
        availStock,
      },
    }))
  }, [availStock, setCurrentData])

  // fetch part on Enter
  const handleFetchPart = async () => {
    const pnRaw = learPN.trim()
    if (pnRaw.length !== 16) {
      toast.error('Lear PN must be 16 characters')
      return
    }
    if (!pnRaw.toLowerCase().startsWith('p')) {
      toast.error('Lear PN must start with "P"')
      return
    }

    const apiPN = pnRaw.substring(1) // remove leading char for API
    setLoading(true)

    try {
      const res = await fetch(`http://localhost:8080/api/parts/lear?learPN=${apiPN}`)
      if (!res.ok) throw new Error('Part not found')
      const data = await res.json()

      // update local and global
      setPart({
        tescaPN: data.tescaPN || '',
        desc: data.desc || '',
        qtyPerBox: data.qtyPerBox || '',
      })

      setCurrentData((prev) => ({
        ...prev,
        part: {
          ...prev.part,
          learPN: pnRaw,
          tescaPN: data.tescaPN || '',
          desc: data.desc || '',
          qtyPerBox: data.qtyPerBox || '',
        },
      }))

      toast.success('Part fetched. Continue...')
      setTimeout(() => storageRef.current?.focus(), 200)
    } catch (err) {
      toast.error('Part not found')
      setPart({ tescaPN: '', desc: '', qtyPerBox: '' })
    } finally {
      setLoading(false)
    }
  }

  // storage done on Enter: validate length and 's' prefix, then remove leading 's'
  const handleStorageDone = () => {
    let su = storageUnit.trim()
    if (su.length !== 10) {
      toast.error('HU Galia must be 10 characters')
      return
    }
    if (!su.toLowerCase().startsWith('s')) {
      toast.error('HU Galia must start with "s"')
      return
    }
    // remove leading 's' before storing (as you requested previously)
    const suStored = su.substring(1)

    // Show input as typed (we don't change the visible input here),
    // but store the value without 's' (this mirrors your previous behavior)
    setCurrentData((prev) => ({
      ...prev,
      materile: {
        ...prev.materile,
        storageUn: suStored,
      },
    }))

    toast.success('HU Galia accepted. Enter available stock.')
    setTimeout(() => availRef.current?.focus(), 200)
  }

  // when availStock matches Q\d{2} -> go next
  useEffect(() => {
    if (/^Q\d{2}$/.test(availStock)) {
      toast.success('All fields complete. Proceeding...')
      setTimeout(() => nextFunction(), 600)
    }
  }, [availStock, nextFunction])

  const handleKeyDown = (e, type) => {
    if (e.key !== 'Enter' || loading) return
    if (type === 'part') handleFetchPart()
    if (type === 'storage') handleStorageDone()
  }

  return (
    <div className="w-full p-6">
      <Card className="w-full rounded-2xl p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Part & Material Information</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* PART SECTION */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Part Information</h3>

              <div className="space-y-2">
                <Label className="text-lg font-medium">Lear PN</Label>
                <Input
                  className="h-12 px-4 text-lg"
                  ref={learPNRef}
                  value={learPN}
                  onChange={(e) => setLearPN(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'part')}
                  maxLength={16}
                  placeholder="Enter Lear PN (starts with P, 16 chars)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-medium">Tesca PN</Label>
                <Input
                  className="h-12 px-4 text-lg"
                  readOnly
                  value={part.tescaPN}
                  placeholder="Auto-filled"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-medium">Description</Label>
                <Input
                  className="h-12 px-4 text-lg"
                  readOnly
                  value={part.desc}
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            {/* MATERIAL SECTION */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Material Information</h3>

              <div className="space-y-2">
                <Label className="text-lg font-medium">HU Galia</Label>
                <Input
                  className="h-12 px-4 text-lg"
                  ref={storageRef}
                  value={storageUnit}
                  onChange={(e) => setStorageUnit(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'storage')}
                  maxLength={10}
                  placeholder='Enter HU Galia (starts with s, 10 chars)'
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-medium">Available Stock</Label>
                <Input
                  className="h-12 px-4 text-lg"
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
   CompleteComponent
   - barcode1 = currentData.part.learPN (forced)
   - barcode2 must start with learPN.slice(3,9)
   - barcode2 length 13, unique
   - auto-add, auto-generate, auto-validate
   - store barcodes in currentData.materile.barcodes
   - restores state from global on mount
   ----------------------------- */
function CompleteComponent() {
  const { currentData, setCurrentData } = useCurrentData()

  const qty =
    Number((currentData.part.qtyPerBox ?? 0).toString().replace(/\D/g, '')) || 0
  const learPN = currentData.part.learPN.substring(1, 16) || ''
  const prefix6 = learPN.slice(4, 10) // as user confirmed

  // local UI state but also push to global on changes
  const [barcode1, setBarcode1] = useState(learPN)
  const [barcode2, setBarcode2] = useState('')
  const [barcodesLocal, setBarcodesLocal] = useState(currentData.materile.barcodes || [])
  const [ticketCode, setTicketCode] = useState(currentData.ticketCode || null)
  const [processing, setProcessing] = useState(false)

  const barcode1Ref = useRef(null)
  const barcode2Ref = useRef(null)

  // restore on mount (helps if global was updated while component unmounted)
  useEffect(() => {
    setBarcode1(currentData.part.learPN.substring(1, 16) || '')
    setBarcodesLocal(currentData.materile.barcodes || [])
    setTicketCode(currentData.ticketCode || null)
    setTimeout(() => barcode1Ref.current?.focus(), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep barcode1 in sync with global learPN
  useEffect(() => {
    setBarcode1(learPN)
  }, [learPN])

  // focus barcode1 on mount (already attempted above)
  useEffect(() => {
    barcode1Ref.current?.focus()
  }, [])

  // keep global barcodes in sync when local changes
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      materile: {
        ...prev.materile,
        barcodes: barcodesLocal,
      },
    }))
  }, [barcodesLocal, setCurrentData])

  // keep ticket in global when changes
  useEffect(() => {
    setCurrentData((prev) => ({ ...prev, ticketCode }))
  }, [ticketCode, setCurrentData])

  // VALIDATION helpers
  const isBarcode2Unique = (b2) => !barcodesLocal.some((b) => b.barcode2 === b2)

  const validateBarcode2 = (value) => {
    if (!prefix6) {
      toast.error('Lear PN is missing or invalid (needed for prefix).')
      return false
    }
    if (!value.startsWith(prefix6)) {
      toast.error(`Traceability code must start with ${prefix6}`)
      return false
    }
    if (value.length !== 13) {
      toast.error('Traceability code must be exactly 13 characters')
      return false
    }
    if (!isBarcode2Unique(value)) {
      toast.error('This traceability code is already used')
      return false
    }
    if (barcodesLocal.length >= qty) {
      toast.error('You have reached the required quantity')
      return false
    }
    return true
  }

  // ADD handler (called after barcode2 validated)
  const handleAdd = () => {
    if (barcode1 !== learPN) {
      toast.error('Réf Lear must match the Lear PN')
      return
    }

    if (!validateBarcode2(barcode2)) return

    const newList = [...barcodesLocal, { barcode1, barcode2 }]
    setBarcodesLocal(newList)
    setBarcode2('')
    setTimeout(() => barcode1Ref.current?.focus(), 80)
  }

  // auto-add when barcode2 is typed/scanned and reaches length 13
  useEffect(() => {
    if (barcode2.length === 13) {
      // attempt to add automatically
      if (validateBarcode2(barcode2)) {
        handleAdd()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode2])

  // generate ticket code when qty reached
  useEffect(() => {
    if (qty > 0 && barcodesLocal.length === qty && !ticketCode) {
      generateTicketCode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodesLocal])

  const generateTicketCode = async () => {
    try {
      setProcessing(true)
      const res = await fetch('http://localhost:8080/api/ticketscode/creat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suffix: learPN.slice(-5) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to generate ticket')
      }
      const data = await res.json()
      setTicketCode(data.code)
      toast.success('Ticket generated automatically.')
      // auto validate shortly after
      setTimeout(() => bulkValidate(data.code), 300)
    } catch (err) {
      toast.error(err.message || 'Ticket generation failed')
    } finally {
      setProcessing(false)
    }
  }

  const bulkValidate = async (code = ticketCode) => {
    try {
      setProcessing(true)
      const res = await fetch('http://localhost:8080/api/tickets/bulk', {
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Bulk save failed')
      }

      toast.success(`Saved ${barcodesLocal.length} traceability codes.`)
    } catch (err) {
      toast.error(err.message || 'Bulk save failed')
    } finally {
      setProcessing(false)
    }
  }

  const progress = qty === 0 ? 0 : (barcodesLocal.length / qty) * 100
  const itemsLeft = Math.max(0, qty - barcodesLocal.length)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Barcode Collector</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* BARCODE 1: forced read-only */}
            <div className="space-y-2">
              <Label>Réf Lear</Label>
              <Input
                ref={barcode1Ref}
                value={barcode1}
                readOnly
                className="bg-gray-100"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') barcode2Ref.current?.focus()
                }}
              />
            </div>

            {/* BARCODE 2: typed or scanned */}
            <div className="space-y-2">
              <Label>Traceability Code</Label>
              <Input
                ref={barcode2Ref}
                value={barcode2}
                onChange={(e) => setBarcode2(e.target.value)}
                placeholder={
                  prefix6 ? `Must start with ${prefix6} (13 chars)` : 'LearPN missing'
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (validateBarcode2(barcode2)) {
                      handleAdd()
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Progress card */}
          <Card className="mt-6 w-full">
            <CardHeader>
              <CardTitle className="text-center">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex justify-between text-sm">
                <span>{itemsLeft > 0 ? `${itemsLeft} left` : 'All captured 🎉'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </CardContent>
          </Card>

          <div className="mt-4 flex justify-between gap-2">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (validateBarcode2(barcode2)) handleAdd()
                }}
                disabled={processing}
              >
                Add
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => generateTicketCode()}
                disabled={processing || barcodesLocal.length < qty}
                title={barcodesLocal.length < qty ? 'Capture all barcodes first' : 'Generate ticket'}
              >
                Generate code
              </Button>

              <Button onClick={() => bulkValidate()} disabled={processing || !ticketCode} variant="secondary">
                Validate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {barcodesLocal.length > 0 && (
        <Card className="rounded-2xl shadow-md">
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

      {/* Ticket Code */}
      {ticketCode && (
        <div className="mt-4 text-center">
          <p className="text-lg font-semibold">
            Ticket Code: <span className="text-primary font-mono">{ticketCode}</span>
          </p>
        </div>
      )}
    </div>
  )
}
