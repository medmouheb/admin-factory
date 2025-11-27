import { useState, useEffect, useRef, useMemo } from 'react'
import { useStepper } from './stepper-config'
import { useCurrentData } from './context'
import { BarcodeEntry } from './types'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'
import { ErrorPopup } from './error-popup'

export function TransferPrepComponent() {
  const stepper = useStepper()
  const { currentData, setCurrentData } = useCurrentData()
  const { auth } = useAuthStore()


  const qty = Number(String(currentData.part.qtyPerBox ?? '0').replace(/\D/g, '')) || 0
  const learPNFull = String(currentData.part.learPN || '')
  const learPN = learPNFull.substring(1, 16) || ''
  const prefix6 = learPN.slice(4, 10)

  const [barcode1, setBarcode1] = useState(learPN)
  const [barcode2, setBarcode2] = useState('')
  const [barcodesLocal, setBarcodesLocal] = useState<BarcodeEntry[]>(
    currentData.materile.barcodes || []
  )
  const [ticketCode, setTicketCode] = useState(currentData.ticketCode || null)
  const [processing, setProcessing] = useState(false)
  const [showPdfButton, setShowPdfButton] = useState(false)

  const [showPreview, setShowPreview] = useState(false)

  const qrData = useMemo(
    () => ({
      ticketCode: ticketCode || '',
      learPN: learPN || '',
      date: new Date().toISOString(),
      barcodes: barcodesLocal,
      qty: qty || 0,
    }),
    [ticketCode, learPN, barcodesLocal, qty]
  )
  const shouldShowQrSnapshot = useMemo(
    () => Boolean(ticketCode || barcodesLocal.length > 0 || barcode2.length > 0),
    [ticketCode, barcodesLocal.length, barcode2.length]
  )

  const barcode1Ref = useRef<HTMLInputElement>(null)
  const barcode2Ref = useRef<HTMLInputElement>(null)

  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [shakingField, setShakingField] = useState<string | null>(null)

  const showError = (msg: string, fieldId: string | null = null) => {
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
    if (stepper.current.id === 'TransferPrep') {
      setTimeout(() => barcode2Ref.current?.focus(), 60)
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
      ticketCode
    }))
  }, [barcodesLocal, ticketCode])

  // Validation
  const isBarcode2Unique = (b2: string) => !barcodesLocal.some((b) => b.barcode2 === b2)

  const validateBarcode2 = async (value: string) => {
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

    // Check if barcode already exists in database
    try {
      const res = await fetch(`http://localhost:8080/api/tickets/check/${value}`)
      const data = await res.json()

      if (data.exists) {
        showError('Barcode already exists in database', 'barcode2')
        setBarcode2('')
        return false
      }
    } catch (err) {
      console.error('Error checking barcode:', err)
      // Continue with validation even if check fails
    }

    return true
  }

  const handleAdd = async () => {
    if (barcode1 !== learPN) {
      showError('Réf Lear must match', 'barcode1')
      return
    }
    if (!(await validateBarcode2(barcode2))) return

    const newList = [...barcodesLocal, { barcode1, barcode2, errorCode: 'N/A' }]
    setBarcodesLocal(newList)
    setBarcode2('')
    setTimeout(() => barcode1Ref.current?.focus(), 80)
  }

  // Auto-add
  useEffect(() => {
    const checkAndAdd = async () => {
      if (barcode2.length === 13 && (await validateBarcode2(barcode2))) {
        await handleAdd()
      }
    }
    checkAndAdd()
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
        credentials: 'include',   // ⬅️ VERY IMPORTANT
        body: JSON.stringify({
          suffix: learPN.slice(-5),
          learPN: learPN,
          quantity: qty,
          hu: currentData.materile.storageUn
        }),
      })
      const data = await res.json()
      setTicketCode(data.code)
      toast.success('Ticket generated.')
      await bulkValidate(data.code)
      await handleGenerateAndPrint()
    } catch (err: any) {
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
            barcode: b.barcode2,
            ticketCode: code,
          }))
        ),
      })
      toast.success(`Saved ${barcodesLocal.length} codes.`)
      setShowPdfButton(true)
    } catch (err: any) {
      toast.error(err.message || 'Bulk save failed')
    } finally {
      setProcessing(false)
    }
  }

  const savePacket = async () => {
    try {
      const packetData = {
        id: ticketCode,
        huGalia: currentData.materile.storageUn,
        location: '354D',
        status: 'Ready for Transfer',
        quantity: qty,
        date: new Date().toISOString().split('T')[0],
        pieces: barcodesLocal.map(b => ({ barcode: b.barcode2, status: 'OK' })),
        userId: auth.user?.username || 'Unknown',
        userMatricule: auth.user?.matricule
      }

      const res = await fetch('http://localhost:8080/api/packets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packetData)
      })

      if (!res.ok) throw new Error('Failed to save packet')
      toast.success('Packet saved to database')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save packet')
      throw error
    }
  }

  const handleGenerateAndPrint = async () => {
    if (!ticketCode) return
    try {
      generateTicketPDF()
    } catch (e) {
      // Error handled in savePacket
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

      ^FO20,290^A0N,20,20^FDOper: ${auth.user?.matricule}^FS

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
        if (iframe.contentWindow) {
          iframe.contentWindow.print();
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      };

      toast.success('Impression lancée sur l\'imprimante par défaut');

    } catch (err: any) {
      toast.error(err.message || 'Impression échouée');
      // downloadZPL(); // Function not defined
    } finally {
      setProcessing(false);
    }
  };



  // Preview du ticket
  const PreviewTicket = () => {
    if (!showPreview || !ticketCode) return null

    const combinedBarcode = `${ticketCode}`

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
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Smaller background around popup */}
        <div className="bg-black/40 backdrop-blur-sm p-4 rounded-2xl">

          <div className="relative max-w-lg max-h-[50vh] overflow-auto rounded-xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 text-2xl font-bold text-gray-600 hover:text-gray-800"
            >
              ×
            </button>

            <h2 className="mb-4 text-center text-xl font-bold">
              Prévisualisation du Ticket Galia
            </h2>

            <div className="mx-auto w-[400px] border-2 border-gray-800 bg-white p-4">
              <div className="space-y-2">
                <div className="text-3xl font-bold">tesca</div>

                <div className="mt-3 text-sm font-semibold">
                  {learPN}
                </div>

                <div className="my-3 flex flex-col items-center gap-2">
                  <svg className="w-full" height="80" viewBox="0 0 400 80">
                    {combinedBarcode.split('').map((char, idx) => {
                      const barWidth = char.charCodeAt(0) % 3 + 2;
                      const xPos = idx * 12;
                      return (
                        <rect
                          key={idx}
                          x={xPos}
                          y="0"
                          width={barWidth}
                          height="60"
                          fill="black"
                        />
                      );
                    })}
                  </svg>
                  <div className="text-xs font-mono tracking-wider">{ticketCode}</div>
                </div>

                <div className="text-center text-lg font-bold">
                  {auth.user?.matricule}
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <div className="font-semibold">
                    Date: {dateStr} Time: {timeStr}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      </div>

    )
  }

  const generateTicketPDF = () => {
    const doc = new jsPDF({ unit: 'cm', format: [5, 5] });

    let y = 0.3; // top margin

    // QR Code (1.0 cm)
    const qrSizeCm = 1.0;
    const dpi = 96;
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = qrSizeCm * dpi / 2.54;
    qrCanvas.height = qrCanvas.width;

    // (You can generate QR code here if needed, e.g., using QRCode.js or other lib)

    // Title
    doc.setFontSize(10); // smaller than before
    doc.setFont('helvetica', 'bold');
    doc.text('tesca', 0.2, y);
    y += 0.5;

    // Lear PN
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(learPN, 0.2, y);
    y += 0.4;

    // Barcode for ticket code
    const canvas1 = document.createElement('canvas');
    if (ticketCode) {
      JsBarcode(canvas1, ticketCode, {
        format: 'CODE128',
        width: 0.8, // narrower to fit
        height: 20, // slightly shorter
        displayValue: false,
      });
      doc.addImage(canvas1.toDataURL('image/png'), 'PNG', 0.2, y, 4.6, 1); // width adjusted
    }
    y += 1.1;

    // Ticket code (centered)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth(ticketCode || '');
    const xCentered = (5 - textWidth) / 2; // center in 5cm page
    doc.text(ticketCode || '', xCentered, y);
    y += 0.6;

    // Operator
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`Oper: ${auth.user?.matricule}`, 0.2, y);
    y += 0.4;

    // Quantity
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Qty: ${qty}`, 0.2, y);
    y += 0.4;

    // Date & Time
    const now = new Date();
    doc.setFontSize(6);
    doc.text(
      `Date: ${now.toLocaleDateString()} Time: ${now.toLocaleTimeString()}`,
      0.2,
      y
    );

    // Print
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      }, 100);
    };
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
          {itemsLeft > 0 ?
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
                  autoComplete='off'
                />
              </div>
            </div>
            :
            ''}




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

      {progress === 100 && (
        <div className='mt-4 flex flex-wrap justify-center gap-3'>
          <button
            onClick={() => setShowPreview(true)}
            className='rounded bg-orange-600 px-6 py-2 text-white hover:bg-orange-700'
          >
            👁️ Show Ticket and Download
          </button>
          <button
            onClick={handleGenerateAndPrint}
            className='rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700'
          >
            🖨️ Generate & Print
          </button>
        </div>
      )}
      <ErrorPopup
        open={errorOpen}
        onOpenChange={setErrorOpen}
        message={errorMessage}
      />
    </div>
  )
}
