// StepperFull.jsx
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useMemo,
} from 'react'
import { defineStepper } from '@stepperize/react'
import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from './ui/table'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Stepper, Step } from '@/components/ui/stepper'
pdfMake.vfs = pdfFonts.vfs;

/* -----------------------------
   ----------------------------- */
const { useStepper, steps, utils } = defineStepper(
  {
    id: 'LearPN',
    title: 'Check Réf Galia',
    description: 'Scan Lear PN & Galia',
  },
  {
    id: 'RepairDetails',
    title: 'Repair Details',
    description: 'Enter repair info',
  },
  {
    id: 'complete',
    title: 'Check traceability Label',
    description: 'Scan & Print Labels',
  }
)

const CurrentDataContext = createContext(null)
function CurrentDataProvider({ children }) {
  const [currentData, setCurrentData] = useState({
    part: { learPN: '', tescaPN: '', desc: '', qtyPerBox: '' },
    materile: { storageUn: '', availStock: '', barcodes: [] },
    repair: { codePiece: '', checklist: [] },
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
      repair: { codePiece: '', checklist: [] },
      ticketCode: null,
      hasCompletedStep1: false,
    })
    stepper.reset()
  }

  const isStep1Valid = useMemo(() => {
    const { part, materile } = currentData
    const isLearPN =
      part.learPN?.trim().length === 16 &&
      part.learPN.toLowerCase().startsWith('p')
    const isPartLoaded = !!part.tescaPN
    const isStorage =
      materile.storageUn?.trim().length === 10 &&
      materile.storageUn.toLowerCase().startsWith('s')
    const isAvail = /^Q\d{2}$/.test(materile.availStock || '')
    return isLearPN && isPartLoaded && isStorage && isAvail
  }, [currentData])

  const isStep2Valid = useMemo(() => {
    const { repair } = currentData
    return repair?.codePiece?.trim().length > 0
  }, [currentData])

  return (
    <div className='container mx-auto p-6'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Reapirage Process</h2>
          <p className='text-muted-foreground'>
            Follow the steps to complete the check.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <span className='rounded-full bg-muted px-3 py-1 text-sm font-medium'>
            Step {currentIndex + 1} of {steps.length}
          </span>
        </div>
      </div>

      <div className='grid gap-8 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]'>
        <div className='hidden md:block'>
          <Card className='h-full border-none shadow-none bg-transparent'>
            <CardContent className='p-0'>
              <Stepper orientation='vertical' activeStep={currentIndex}>
                {stepper.all.map((step, index) => (
                  <Step
                    key={step.id}
                    label={step.title}
                    description={step.description}
                    onClick={() => {
                      if (index === 1 && !isStep1Valid) return
                      if (index === 2 && (!isStep1Valid || !isStep2Valid)) return
                      stepper.goTo(step.id)
                    }}
                  />
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Stepper (Horizontal) */}
        <div className='md:hidden'>
          <Stepper orientation='horizontal' activeStep={currentIndex}>
            {stepper.all.map((step, index) => (
              <Step
                key={step.id}
                // label={step.title} // Hide label on mobile to save space
                onClick={() => {
                  if (index === 1 && !isStep1Valid) return
                  if (index === 2 && (!isStep1Valid || !isStep2Valid)) return
                  stepper.goTo(step.id)
                }}
              />
            ))}
          </Stepper>
        </div>

        <div className='flex flex-col gap-6'>
          <div className='min-h-[400px]'>
            {stepper.switch({
              LearPN: () => <MaterialAndPartForm nextFunction={stepper.next} />,
              RepairDetails: () => <RepairDetailsForm nextFunction={stepper.next} />,
              complete: () => <CompleteComponent />,
            })}
          </div>

          {!stepper.isLast ? (
            <div className='flex justify-end gap-4 border-t pt-6'>
              <Button
                variant='outline'
                onClick={stepper.prev}
                disabled={stepper.isFirst}
                className='w-32'
              >
                Back
              </Button>
              <Button
                onClick={stepper.next}
                disabled={
                  (stepper.current.id === 'LearPN' && !isStep1Valid) ||
                  (stepper.current.id === 'RepairDetails' && !isStep2Valid)
                }
                className='w-32'
              >
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          ) : (
            <div className='flex justify-end border-t pt-6'>
              <Button onClick={handleFullReset} className='w-32'>
                Reset
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* -----------------------------
   RepairDetailsForm
   ----------------------------- */
function RepairDetailsForm({ nextFunction }) {
  const { currentData, setCurrentData } = useCurrentData()
  const [codePiece, setCodePiece] = useState(currentData.repair?.codePiece || '')
  const [checklist, setChecklist] = useState(currentData.repair?.checklist || [])

  const handleChecklistChange = (item, checked) => {
    setChecklist(prev =>
      checked ? [...prev, item] : prev.filter(i => i !== item)
    )
  }

  useEffect(() => {
    setCurrentData(prev => ({
      ...prev,
      repair: { codePiece, checklist }
    }))
  }, [codePiece, checklist])

  return (
    <div className='w-full p-6'>
      <Card className='w-full rounded-2xl p-6 shadow-lg border-t-4 border-t-primary'>
        <CardHeader>
          <CardTitle className='text-2xl'>Repair Details</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label>Code Pièce</Label>
            <Input
              value={codePiece}
              onChange={e => setCodePiece(e.target.value)}
              placeholder='Enter Code Pièce'
            />
          </div>
          <div className='space-y-2'>
            <Label>Checklist</Label>
            <div className='flex flex-col gap-2'>
              {['Check 1', 'Check 2', 'Check 3'].map(item => (
                <div key={item} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={checklist.includes(item)}
                    onChange={e => handleChecklistChange(item, e.target.checked)}
                  />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
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

  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [shakingField, setShakingField] = useState(null)

  const showError = (msg, fieldId = null) => {
    setErrorMessage(msg)
    setErrorOpen(true)
    if (fieldId) {
      setShakingField(fieldId)
      setTimeout(() => setShakingField(null), 500)
    }
  }

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
      return showError('Lear PN must start with P', 'learPN')
    if (pn.length !== 16) return showError('Lear PN must be 16 characters', 'learPN')

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
      showError('Part not found', 'learPN')
      setPart({ tescaPN: '', desc: '', qtyPerBox: '' })
    } finally {
      setLoading(false)
    }
  }

  // validate storage
  const handleStorageDone = () => {
    const su = storageUnit.trim()
    if (!su.toLowerCase().startsWith('s'))
      return showError('HU Galia must start with s', 'storage')
    if (su.length !== 10) return showError('HU Galia must be 10 characters', 'storage')
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
      <Card className='w-full rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-xl transition-all border-t-4 border-t-primary'>
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
                  className={cn(
                    'h-12 px-4 text-lg transition-all duration-200',
                    shakingField === 'learPN' &&
                    'animate-shake border-destructive ring-2 ring-destructive/20'
                  )}
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
                  className={cn(
                    'h-12 px-4 text-lg transition-all duration-200',
                    shakingField === 'storage' &&
                    'animate-shake border-destructive ring-2 ring-destructive/20'
                  )}
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
      <ErrorPopup
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMessage}
      />
    </div>
  )
}

/* -----------------------------
   CompleteComponent
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
  const [operatorNumber, setOperatorNumber] = useState(
    currentData.operatorNumber || '332110'
  )
  const [showPreview, setShowPreview] = useState(false)

  const qrData = useMemo(
    () => ({
      ticketCode: ticketCode || '',
      learPN: learPN || '',
      operatorNumber: operatorNumber || '',
      date: new Date().toISOString(),
      barcodes: barcodesLocal,
      qty: qty || 0,
    }),
    [ticketCode, learPN, operatorNumber, barcodesLocal, qty]
  )
  const shouldShowQrSnapshot = useMemo(
    () => Boolean(ticketCode || barcodesLocal.length > 0 || barcode2.length > 0),
    [ticketCode, barcodesLocal.length, barcode2.length]
  )

  const barcode1Ref = useRef(null)
  const barcode2Ref = useRef(null)

  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [shakingField, setShakingField] = useState(null)

  const showError = (msg, fieldId = null) => {
    setErrorMessage(msg)
    setErrorOpen(true)
    if (fieldId) {
      setShakingField(fieldId)
      setTimeout(() => setShakingField(null), 500)
    }
  }

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
      operatorNumber,
    }))
  }, [barcodesLocal, ticketCode, operatorNumber])

  // Validation
  const isBarcode2Unique = (b2) => !barcodesLocal.some((b) => b.barcode2 === b2)

  const validateBarcode2 = (value) => {
    if (!prefix6) {
      showError('Lear PN is missing.', 'barcode2')
      return false
    }
    if (!value.startsWith(prefix6)) {
      showError(`Must start with ${prefix6}`, 'barcode2')
      return false
    }
    if (value.length !== 13) {
      showError('Must be 13 chars', 'barcode2')
      return false
    }
    if (!isBarcode2Unique(value)) {
      showError('Already used', 'barcode2')
      return false
    }
    if (barcodesLocal.length >= qty) {
      showError('Reached required quantity', 'barcode2')
      return false
    }
    return true
  }

  const handleAdd = () => {
    if (barcode1 !== learPN) {
      showError('Réf Lear must match', 'barcode1')
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
      setShowPdfButton(true)
    } catch (err) {
      toast.error(err.message || 'Bulk save failed')
    } finally {
      setProcessing(false)
    }
  }

  // Génération du code ZPL pour étiquette Galia format Tesca
  const generateZPL = () => {
    // Code-barres combiné: LearPN + TicketCode
    const combinedBarcode = `${learPN}${ticketCode}`

    // Date et heure actuelles
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })

    const zpl = `
        ^XA
        ^CI28
        ^PW812
        ^LL406

        ^FO20,20^A0N,35,35^FDtesca^FS

        ^FO20,80^A0N,25,25^FD${learPN}^FS

        ^FO20,120^BY2,3^BCN,100,N,N,N^FD${combinedBarcode}^FS

        ^FO20,240^A0N,30,30^FD${learPN} ${ticketCode}^FS

        ^FO20,290^A0N,20,20^FDOper: ${operatorNumber}^FS

        ^FO20,320^A0N,20,20^FDDate: ${dateStr} Time: ${timeStr}^FS

        ^XZ
        `
    return zpl.trim()
  }

  // Envoi du ZPL à l'imprimante Zebra via backend
  const printToGodex = async () => {
    try {
      setProcessing(true);
      const ezplCode = generateZPL();

      // Convertir le code EZPL en Blob
      const blob = new Blob([ezplCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Créer un iframe caché pour l'impression
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = function () {
        iframe.contentWindow.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };
      console.log(" hggvhbh", ezplCode);
      toast.success('Impression lancée sur l\'imprimante par défaut');

    } catch (err) {
      toast.error(err.message || 'Impression échouée');
      downloadZPL();
    } finally {
      setProcessing(false);
    }
  };

  // Télécharger le code ZPL
  const downloadZPL = () => {
    const zplCode = generateZPL()
    const blob = new Blob([zplCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `galia_label_${ticketCode}.zpl`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.info('Fichier ZPL téléchargé.')
  }

  // Preview du ticket
  const PreviewTicket = () => {
    if (!showPreview || !ticketCode) return null

    const combinedBarcode = `${learPN}${ticketCode}`

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
        <div className='relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6'>
          <button
            onClick={() => setShowPreview(false)}
            className='absolute right-4 top-4 text-2xl font-bold text-gray-600 hover:text-gray-800'
          >
            ×
          </button>

          <h2 className='mb-4 text-center text-xl font-bold'>
            Prévisualisation du Ticket Galia
          </h2>

          <div className='mx-auto w-[400px] border-2 border-gray-800 bg-white p-4'>
            <div className='space-y-2'>
              <div className='text-3xl font-bold'>tesca</div>

              <div className='mt-3 text-sm font-semibold'>
                {learPN}
              </div>

              <div className='my-3 flex flex-col items-center gap-2'>
                <svg className='w-full' height='80' viewBox='0 0 400 80'>
                  {combinedBarcode.split('').map((char, idx) => {
                    const barWidth = char.charCodeAt(0) % 3 + 2;
                    const xPos = idx * 12;
                    return (
                      <rect
                        key={idx}
                        x={xPos}
                        y='0'
                        width={barWidth}
                        height='60'
                        fill='black'
                      />
                    );
                  })}
                </svg>
                <div className='text-xs font-mono tracking-wider'>{combinedBarcode}</div>
              </div>

              <div className='text-center text-lg font-bold'>
                {learPN} {ticketCode}
              </div>

              <div className='mt-4 space-y-1 text-sm'>
                <div className='font-semibold'>Oper: {operatorNumber}</div>
                <div className='font-semibold'>Date: {dateStr} Time: {timeStr}</div>
              </div>
            </div>
          </div>

          <div className='mt-6 text-center'>
            <button
              onClick={() => setShowPreview(false)}
              className='rounded bg-gray-600 px-6 py-2 text-white hover:bg-gray-700'
            >
              Fermer
            </button>
            <button
              onClick={() =>
                generateTicketPDF()
              }
              className='rounded bg-gray-600 px-6 py-2 text-white hover:bg-gray-700'
            >
              pdf
            </button>
          </div>
        </div>
      </div>
    )
  }

  const generateTicketPDF = () => {
    const doc = new jsPDF({ unit: 'cm', format: [5, 5] });

    let y = 0.3;

    // QR Code with all data
    const qrSizeCm = 1.2;
    const dpi = 96;
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = qrSizeCm * dpi / 2.54;
    qrCanvas.height = qrCanvas.width;

    ;



    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('tesca', 0.2, y);
    y += 0.6;

    // Lear PN
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(learPN, 0.2, y);
    y += 0.5;

    // Barcode for ticket code
    const canvas1 = document.createElement('canvas');
    JsBarcode(canvas1, ticketCode, {
      format: 'CODE128',
      width: 1,
      height: 25,
      displayValue: false,
    });
    doc.addImage(canvas1.toDataURL('image/png'), 'PNG', 0.2, y, 4.5, 1);
    y += 1.2;

    // Ticket code (centered)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth(ticketCode);
    const xCentered = (textWidth) / 2;
    doc.text(ticketCode, xCentered, y);
    y += 0.8;

    // Operator (bold and larger)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Oper: ${operatorNumber}`, 0.2, y);
    y += 0.5;

    // Date & Time
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(`Date: ${now.toLocaleDateString()} Time: ${now.toLocaleTimeString()}`, 0.2, y);

    // Print
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const progress = qty === 0 ? 0 : (barcodesLocal.length / qty) * 100
  const itemsLeft = Math.max(0, qty - barcodesLocal.length)

  return (
    <div className='mx-auto w-full max-w-2xl space-y-6 p-6'>
      <PreviewTicket />

      <Card className='rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-xl transition-all border-t-4 border-t-primary'>
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
                className={cn(
                  'transition-all duration-200',
                  shakingField === 'barcode2' &&
                  'animate-shake border-destructive ring-2 ring-destructive/20'
                )}
                placeholder={
                  prefix6
                    ? `Must start with ${prefix6} (13 chars)`
                    : 'LearPN missing'
                }
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Numéro Opérateur</Label>
            <Input
              value={operatorNumber}
              onChange={(e) => setOperatorNumber(e.target.value)}
              placeholder="Ex: 332110"
            />
          </div>

          <Card className='mt-6 w-full animate-in zoom-in-95 duration-500 hover:scale-[1.02] transition-transform'>
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

      {shouldShowQrSnapshot && (
        <Card className='rounded-2xl shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700 hover:shadow-lg transition-all'>
          <CardHeader>
            <CardTitle>Traceability Codes Added</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='mt-4 rounded-lg border bg-muted/50 p-4'>
              <p className='mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                QR Data Snapshot
              </p>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className='font-medium'>Ticket Code</TableCell>
                    <TableCell className='font-mono'>
                      {qrData.ticketCode || '—'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Lear PN</TableCell>
                    <TableCell className='font-mono'>
                      {qrData.learPN || '—'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Operator</TableCell>
                    <TableCell>{qrData.operatorNumber || '—'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Date</TableCell>
                    <TableCell>
                      {qrData.date
                        ? new Date(qrData.date).toLocaleString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Qty Required</TableCell>
                    <TableCell>{qrData.qty || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Barcodes</TableCell>
                    <TableCell>
                      {qrData.barcodes.length > 0 ? (
                        <div className='space-y-1 text-sm'>
                          {qrData.barcodes.map(
                            (
                              b: { barcode2: string },
                              index: number
                            ) => (
                              <div key={`${b.barcode2}-${index}`}>
                                #{index + 1}:{' '}
                                <span className='font-mono'>{b.barcode2}</span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>
                          No scans yet
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {ticketCode && (
        <div className='mt-4 text-center'>
          <p className='text-lg font-semibold'>
            Ticket Code:{' '}
            <span className='font-mono text-blue-600'>{ticketCode}</span>
          </p>
        </div>
      )}

      {shouldShowQrSnapshot && (
        <Card className='rounded-2xl shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700 hover:shadow-lg transition-all'>
          <CardHeader>
            <CardTitle>QR Data Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className='font-medium'>Ticket Code</TableCell>
                    <TableCell className='font-mono'>
                      {qrData.ticketCode || '—'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Lear PN</TableCell>
                    <TableCell className='font-mono'>
                      {qrData.learPN || '—'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Operator</TableCell>
                    <TableCell>{qrData.operatorNumber || '—'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Date</TableCell>
                    <TableCell>
                      {qrData.date
                        ? new Date(qrData.date).toLocaleString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Qty Required</TableCell>
                    <TableCell>{qrData.qty || 0}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className='font-medium'>Barcodes</TableCell>
                    <TableCell>
                      {qrData.barcodes.length > 0 ? (
                        <div className='space-y-1 text-sm'>
                          {qrData.barcodes.map(
                            (
                              b: { barcode2: string },
                              index: number
                            ) => (
                              <div key={`${b.barcode2}-${index}`}>
                                #{index + 1}:{' '}
                                <span className='font-mono'>{b.barcode2}</span>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <span className='text-muted-foreground'>
                          No scans yet
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* {showPdfButton && ( */}
      <div className='mt-4 flex flex-wrap justify-center gap-3'>
        <button
          onClick={() => setShowPreview(true)}
          className='rounded bg-orange-600 px-6 py-2 text-white hover:bg-orange-700'
        >
          👁️ Show Ticket and Download
        </button>


      </div>
      {/* )} */}
      <ErrorPopup
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMessage}
      />
    </div>
  )
}

function ErrorPopup({ open, onOpenChange, message }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='border-l-8 border-destructive data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-2xl text-destructive'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-6 w-6'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' x2='12' y1='8' y2='12' />
              <line x1='12' x2='12.01' y1='16' y2='16' />
            </svg>
            Error Detected
          </AlertDialogTitle>
          <AlertDialogDescription className='text-base font-medium text-foreground'>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => onOpenChange(false)}
            className='bg-destructive text-destructive-foreground transition-transform hover:scale-105 hover:bg-destructive/90 active:scale-95'
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
