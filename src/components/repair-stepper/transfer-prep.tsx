import React, { useState, useEffect, useRef, useMemo } from 'react'
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

export function TransferPrepComponent() {
  const stepper = useStepper()
  const { currentData, setCurrentData } = useCurrentData()
  const { auth } = useAuthStore()


  const qty = Number(String(currentData.part.qtyPerBox ?? '0').replace(/\D/g, '')) || 0
  const learPNFull = String(currentData.part.learPN || '')
  const learPN = learPNFull.substring(1, 16) || ''
  const prefix6 = learPN.slice(4, 10)

  const [barcode1, setBarcode1] = useState('')
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

  const [shakingField, setShakingField] = useState<string | null>(null)

  const showError = (msg: string, fieldId: string | null = null) => {
    toast.error(msg, {
      duration: 3000,
      style: {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        fontSize: '18px',
        padding: '20px',
        border: 'none',
      },
      className: 'font-bold text-lg'
    })
    if (fieldId) {
      setShakingField(fieldId)
      setTimeout(() => setShakingField(null), 500)
    }
  }

  // Restore state
  useEffect(() => {
    setBarcodesLocal(currentData.materile.barcodes || [])
    setTicketCode(currentData.ticketCode || null)
  }, [])

  // Auto-focus barcode1 on mount
  useEffect(() => {
    setTimeout(() => barcode1Ref.current?.focus(), 60)
  }, [])

  useEffect(() => {
    console.log('Transfer Prep Step   ', stepper.current.id)

    if (stepper.current.id === 'ContainerManagement') {
      setTimeout(() => barcode1Ref.current?.focus(), 60)
    }
  }, [stepper.current.id])

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
      const res = await fetch(`http://localhost:8080/api/tickets/check/${value}`, { credentials: 'include' })
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
    setBarcode1('')
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
      const res = await fetch('http://localhost:8080/api/ticketscode/create', {
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


      generateTicketPDF()

    } catch (err: any) {
      showError(err.message || 'Ticket generation failed')
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
        credentials: 'include',
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
      showError(err.message || 'Bulk save failed')
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
        userId: auth.user?.matricule || 'Unknown',
        userMatricule: auth.user?.matricule
      }

      const res = await fetch('http://localhost:8080/api/packets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(packetData)
      })

      if (!res.ok) throw new Error('Failed to save packet')
      toast.success('Packet saved to database')
    } catch (error) {
      console.error(error)
      showError('Failed to save packet')
      throw error
    }
  }

  const handleGenerateAndPrint = async () => {
    if (!ticketCode) return
    try {
      // await savePacket()
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
      showError(err.message || 'Impression échouée');
      // downloadZPL(); // Function not defined
    } finally {
      setProcessing(false);
    }
  };



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

    // Generate barcode when component mounts
    React.useEffect(() => {
      if (showPreview && ticketCode) {
        const canvas = document.getElementById('preview-barcode-canvas') as HTMLCanvasElement
        if (canvas) {
          try {
            JsBarcode(canvas, combinedBarcode, {
              format: 'CODE128',
              width: 2,
              height: 80,
              displayValue: false,
              margin: 10,
            })
          } catch (err) {
            console.error('Barcode generation error:', err)
          }
        }
      }
    }, [showPreview, ticketCode, combinedBarcode])

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowPreview(false)}
        ></div>

        {/* Modal */}
        <div className="relative max-w-2xl w-full mx-4 animate-in zoom-in-95 duration-300">
          <div className="relative rounded-3xl bg-white p-8 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors group"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Ticket Preview
              </h2>
              <p className="text-gray-600">
                Galia Transfer Label
              </p>
            </div>

            {/* Ticket Preview */}
            <div className="mx-auto max-w-md border-4 border-gray-800 bg-white p-6 rounded-lg shadow-lg">
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex justify-between items-start">
                  <div className="text-4xl font-bold">tesca</div>
                  <div className="text-4xl font-bold">SK</div>
                </div>

                {/* Lear PN */}
                <div className="text-xl font-semibold border-b-2 border-gray-300 pb-2">
                  {learPN}
                </div>

                {/* Barcode */}
                <div className="flex flex-col items-center gap-2 py-4 bg-white">
                  <canvas 
                    id="preview-barcode-canvas"
                    className="max-w-full"
                  ></canvas>
                  <div className="text-sm font-mono tracking-wider font-semibold">
                    {learPN} {ticketCode}
                  </div>
                </div>

                {/* Operator */}
                <div className="text-center">
                  <div className="text-lg font-bold">
                    Oper: {auth.user?.matricule || 'N/A'}
                  </div>
                </div>

                {/* Quantity */}
                <div className="text-center">
                  <div className="text-base font-semibold">
                    Qty: {qty}
                  </div>
                </div>

                {/* Date & Time */}
                <div className="text-center text-sm border-t-2 border-gray-300 pt-2">
                  <div className="font-semibold">
                    Date: {dateStr} Time: {timeStr}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  generateTicketPDF()
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download & Print
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


    // (You can generate QR code here if needed, e.g., using QRCode.js or other lib)

    // Title
    doc.setFontSize(10); // smaller than before
    doc.setFont('helvetica', 'bold');
    doc.text('tesca                             SK', 0.2, y);
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
        width: 1, // narrower to fit
        height: 20, // slightly shorter
        displayValue: false,
      });
      doc.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, y, 4.6, 1); // width adjusted
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
        }, 100000);
      }, 100);
    };
  };


  const progress = qty === 0 ? 0 : (barcodesLocal.length / qty) * 100
  const itemsLeft = Math.max(0, qty - barcodesLocal.length)

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 sm:space-y-8 p-3 sm:p-4 md:p-6 lg:p-8'>
      <PreviewTicket />

      {/* Header Section with Gradient */}
      <div className='relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 sm:p-6 md:p-8 shadow-2xl'>
        <div className='absolute inset-0 opacity-30' style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className='relative'>
          <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3'>
            <svg className='w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
            <span className='truncate'>Transfer Preparation</span>
          </h1>
          <p className='text-blue-100 text-xs sm:text-sm ml-0 sm:ml-0'>Scan and collect barcodes for transfer label generation</p>
        </div>
      </div>

      {/* Main Barcode Collection Card */}
      <Card className='rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-3xl transition-all border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm overflow-hidden'>
        <div className='absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-10 transform translate-x-32 -translate-y-32'></div>
        
        <CardHeader className='pb-4'>
          <CardTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2'>
            <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z' />
            </svg>
            Barcode Scanner
          </CardTitle>
        </CardHeader>
        
        <CardContent className='space-y-6'>
          {itemsLeft > 0 ? (
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {/* Réf Lear Input */}
              <div className='space-y-3 group'>
                <Label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                  </svg>
                  Réf Lear
                  <span className='text-xs text-gray-500 font-normal'>(15 chars, starts with L)</span>
                </Label>
                <Input
                  ref={barcode1Ref}
                  value={barcode1}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase()
                    // Auto-delete: only allow if starts with L or is empty
                    if (value.length > 0 && !value.startsWith('L')) {
                      value = 'L' + value.replace(/^[^L]*/i, '')
                    }
                    // Limit to 15 characters
                    value = value.slice(0, 15)
                    setBarcode1(value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (barcode1.length !== 15) {
                        showError('Réf Lear must be exactly 15 characters', 'barcode1')
                      } else if (!barcode1.startsWith('L')) {
                        showError('Réf Lear must start with L', 'barcode1')
                      } else if (barcode1.toLowerCase() === learPN.toLowerCase()) {
                        barcode2Ref.current?.focus()
                      } else {
                        showError('Réf Lear must match Lear PN', 'barcode1')
                      }
                    }
                  }}
                  className={cn(
                    'h-12 text-base font-mono border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300 uppercase',
                    shakingField === 'barcode1' && 'animate-shake border-red-500 ring-4 ring-red-500/20',
                    barcode1.length > 0 && barcode1.length < 15 && 'border-yellow-500 ring-2 ring-yellow-500/20',
                    barcode1.length === 15 && barcode1.startsWith('L') && 'border-green-500 ring-2 ring-green-500/20'
                  )}
                  placeholder='L + 14 characters...'
                  maxLength={15}
                />
                <div className='flex justify-between text-xs'>
                  <span className={cn(
                    'font-medium',
                    barcode1.length === 0 && 'text-gray-400',
                    barcode1.length > 0 && barcode1.length < 15 && 'text-yellow-600',
                    barcode1.length === 15 && 'text-green-600'
                  )}>
                    {barcode1.length}/15 characters
                  </span>
                  {barcode1.length > 0 && !barcode1.startsWith('L') && (
                    <span className='text-red-600 font-medium'>Must start with L</span>
                  )}
                </div>
              </div>

              {/* Traceability Code Input */}
              <div className='space-y-3 group'>
                <Label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                  Traceability Code
                  <span className='text-xs text-gray-500 font-normal'>(13 chars)</span>
                </Label>
                <Input
                  ref={barcode2Ref}
                  value={barcode2}
                  onChange={(e) => {
                    let value = e.target.value.toUpperCase()
                    // Limit to 13 characters
                    value = value.slice(0, 13)
                    setBarcode2(value)
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      if (barcode2.length !== 13) {
                        showError('Traceability code must be exactly 13 characters', 'barcode2')
                        return
                      }
                      await handleAdd()
                    }
                  }}
                  className={cn(
                    'h-12 text-base font-mono border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-indigo-300 uppercase',
                    shakingField === 'barcode2' && 'animate-shake border-red-500 ring-4 ring-red-500/20',
                    barcode2.length > 0 && barcode2.length < 13 && 'border-yellow-500 ring-2 ring-yellow-500/20',
                    barcode2.length === 13 && 'border-green-500 ring-2 ring-green-500/20'
                  )}
                  placeholder={
                    prefix6
                      ? `Start with ${prefix6} (13 chars)`
                      : 'Awaiting Lear PN...'
                  }
                  autoComplete='off'
                  maxLength={13}
                  disabled={!prefix6}
                />
                <div className='flex justify-between text-xs'>
                  <span className={cn(
                    'font-medium',
                    barcode2.length === 0 && 'text-gray-400',
                    barcode2.length > 0 && barcode2.length < 13 && 'text-yellow-600',
                    barcode2.length === 13 && 'text-green-600'
                  )}>
                    {barcode2.length}/13 characters
                  </span>
                  {prefix6 && barcode2.length > 0 && !barcode2.startsWith(prefix6) && (
                    <span className='text-red-600 font-medium'>Must start with {prefix6}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-8'>
              <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4'>
                <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                </svg>
              </div>
              <h3 className='text-xl font-bold text-gray-800 mb-2'>All Items Scanned!</h3>
              <p className='text-gray-600'>Ready to generate transfer label</p>
            </div>
          )}

          {/* Progress Card with Enhanced Design */}
          <Card className='mt-6 w-full animate-in zoom-in-95 duration-500 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all overflow-hidden rounded-2xl'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5'></div>
            <CardHeader className='relative pb-3'>
              <CardTitle className='text-center text-lg font-bold text-gray-800 flex items-center justify-center gap-2'>
                <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' />
                </svg>
                Scanning Progress
              </CardTitle>
            </CardHeader>
            <CardContent className='relative'>
              <div className='mb-3 flex justify-between items-center text-sm font-medium'>
                <span className='flex items-center gap-2 text-gray-700'>
                  {itemsLeft > 0 ? (
                    <>
                      <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold'>
                        {itemsLeft}
                      </span>
                      remaining
                    </>
                  ) : (
                    <>
                      <span className='text-2xl'>🎉</span>
                      Complete!
                    </>
                  )}
                </span>
                <span className='text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className='relative'>
                <Progress 
                  value={progress} 
                  className='h-4 bg-white/50 rounded-full shadow-inner' 
                />
                {progress === 100 && (
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-xs font-bold text-white drop-shadow-lg'>COMPLETE</span>
                  </div>
                )}
              </div>
              <div className='mt-3 flex justify-between text-xs text-gray-600'>
                <span>{barcodesLocal.length} scanned</span>
                <span>{qty} required</span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Traceability Codes Card */}
      {shouldShowQrSnapshot && (
        <Card className='rounded-3xl shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 hover:shadow-2xl transition-all border-0 bg-white overflow-hidden'>
          <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>
          
          <CardHeader className='bg-gradient-to-br from-gray-50 to-white border-b'>
            <CardTitle className='text-xl font-bold text-gray-800 flex items-center gap-2'>
              <svg className='w-6 h-6 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
              </svg>
              Collected Data Summary
            </CardTitle>
          </CardHeader>
          
          <CardContent className='p-6'>
            <div className='rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 shadow-inner'>
              <p className='mb-4 text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z' clipRule='evenodd' />
                </svg>
                Transfer Data Snapshot
              </p>
              
              <div className='space-y-3'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Ticket Code */}
                  <div className='bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 transition-colors'>
                    <p className='text-xs font-semibold text-gray-500 mb-1'>Ticket Code</p>
                    <p className='text-lg font-mono font-bold text-blue-600'>
                      {qrData.ticketCode || '—'}
                    </p>
                  </div>
                  
                  {/* Lear PN */}
                  <div className='bg-white rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors'>
                    <p className='text-xs font-semibold text-gray-500 mb-1'>Lear PN</p>
                    <p className='text-lg font-mono font-bold text-indigo-600'>
                      {qrData.learPN || '—'}
                    </p>
                  </div>
                  
                  {/* Date */}
                  <div className='bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-300 transition-colors'>
                    <p className='text-xs font-semibold text-gray-500 mb-1'>Date & Time</p>
                    <p className='text-sm font-medium text-gray-800'>
                      {qrData.date ? new Date(qrData.date).toLocaleString() : '—'}
                    </p>
                  </div>
                  
                  {/* Quantity */}
                  <div className='bg-white rounded-xl p-4 border border-gray-200 hover:border-green-300 transition-colors'>
                    <p className='text-xs font-semibold text-gray-500 mb-1'>Quantity Required</p>
                    <p className='text-2xl font-bold text-green-600'>{qrData.qty || 0}</p>
                  </div>
                </div>
                
                {/* Barcodes List */}
                <div className='bg-white rounded-xl p-4 border border-gray-200'>
                  <p className='text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2'>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 10h16M4 14h16M4 18h16' />
                    </svg>
                    Scanned Barcodes ({qrData.barcodes.length})
                  </p>
                  {qrData.barcodes.length > 0 ? (
                    <div className='max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar'>
                      {qrData.barcodes.map((b: { barcode2: string }, index: number) => (
                        <div 
                          key={`${b.barcode2}-${index}`}
                          className='flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors'
                        >
                          <span className='flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold'>
                            {index + 1}
                          </span>
                          <span className='font-mono text-sm font-semibold text-gray-800 flex-1'>
                            {b.barcode2}
                          </span>
                          <svg className='w-5 h-5 text-green-500 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                          </svg>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-8 text-gray-400'>
                      <svg className='w-12 h-12 mx-auto mb-2 opacity-50' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
                      </svg>
                      <p className='text-sm font-medium'>No scans yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Ticket Code Display */}
      {ticketCode && (
        <div className='text-center animate-in fade-in zoom-in-95 duration-500 px-3'>
          <div className='inline-block bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl max-w-full'>
            <p className='text-xs sm:text-sm font-semibold text-blue-100 mb-2'>Generated Ticket Code</p>
            <p className='text-xl sm:text-2xl md:text-3xl font-mono font-bold text-white tracking-wider break-all'>
              {ticketCode}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {progress === 100 && (
        <div className='mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-3 animate-in fade-in slide-in-from-bottom-4 duration-700'>
          <button
            onClick={() => setShowPreview(true)}
            className='group relative inline-flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 active:scale-95 w-full sm:w-auto'
          >
            <svg className='w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
            </svg>
            <span>Preview Ticket</span>
          </button>
          
          <button
            onClick={handleGenerateAndPrint}
            disabled={processing}
            className='group relative inline-flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 w-full sm:w-auto'
          >
            <svg className='w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' />
            </svg>
            <span>{processing ? 'Processing...' : 'Generate & Print'}</span>
          </button>
        </div>
      )}

      {/* Add custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #6366f1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #4f46e5);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
