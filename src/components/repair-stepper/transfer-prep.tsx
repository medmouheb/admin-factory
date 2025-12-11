import React, { useState, useEffect, useRef, useMemo } from 'react'
import JsBarcode from 'jsbarcode'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useCurrentData } from './context'
import { BarcodeEntry } from './types'
import { useTranslation } from 'react-i18next'

export function TransferPrepComponent() {

  const { t } = useTranslation()
  const { currentData, setCurrentData } = useCurrentData()
  const { auth } = useAuthStore()

  const qty =
    Number(String(currentData.part.qtyPerBox ?? '0').replace(/\D/g, '')) || 0
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
    () =>
      Boolean(ticketCode || barcodesLocal.length > 0 || barcode2.length > 0),
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
      className: 'font-bold text-lg',
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



  // Keep global state in sync
  useEffect(() => {
    setCurrentData((prev) => ({
      ...prev,
      materile: { ...prev.materile, barcodes: barcodesLocal },
      ticketCode,
    }))
  }, [barcodesLocal, ticketCode])

  // Validation
  const isBarcode2Unique = (b2: string) =>
    !barcodesLocal.some((b) => b.barcode2 === b2)

  const validateBarcode2 = async (value: string) => {
    const fail = (msg: string) => {
      showError(msg, 'barcode2')
      setBarcode2('')
      return false
    }

    if (!prefix6) return fail('Lear PN is missing.')

    if (!value.startsWith(prefix6)) return fail(`Must start with ${prefix6}`)

    if (value.length !== 13) return fail('Must be 13 chars')

    if (!isBarcode2Unique(value)) return fail('Already used')

    if (barcodesLocal.length >= qty) return fail('Reached required quantity')

    // Check if barcode already exists in database
    try {
      const res = await fetch(
        `http://localhost:8080/api/tickets/check/${value}`,
        { credentials: 'include' }
      )
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
      showError(t('repairStepper.refLearMustMatch'), 'barcode1')
      setBarcode1('')
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
        credentials: 'include', // ⬅️ VERY IMPORTANT
        body: JSON.stringify({
          suffix: learPN.slice(-5),
          learPN: learPN,
          quantity: qty,
          hu: currentData.materile.storageUn,
        }),
      })
      const data = await res.json()
      setTicketCode(data.code)
      toast.success(t('repairStepper.ticketGenerated'))
      await bulkValidate(data.code)

      // Ticket generation logic moved to generateTicketPDF function
      generateTicketPDF(data.code)

    } catch (err: any) {
      showError(err.message || t('repairStepper.ticketGenerationFailed'))
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
      toast.success(t('repairStepper.savedCodes', { count: barcodesLocal.length }))
      setShowPdfButton(true)
    } catch (err: any) {
      showError(err.message || t('repairStepper.bulkSaveFailed'))
    } finally {
      setProcessing(false)
    }
  }

  const handleGenerateAndPrint = async () => {
    if (!ticketCode) return
    try {
      // await savePacket()
      generateTicketPDF(ticketCode)
    } catch (e) {
      // Error handled in savePacket
    }
  }




  // Preview du ticket
  const PreviewTicket = () => {
    if (!showPreview || !ticketCode) return null

    const combinedBarcode = ticketCode

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })

    // Generate barcode when component mounts
    React.useEffect(() => {
      if (showPreview && ticketCode) {
        const canvas = document.getElementById(
          'preview-barcode-canvas'
        ) as HTMLCanvasElement
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
      <div className='animate-in fade-in fixed inset-0 z-50 flex items-center justify-center duration-300'>
        {/* Backdrop */}
        <div
          className='absolute inset-0 bg-black/60 backdrop-blur-sm'
          onClick={() => setShowPreview(false)}
        ></div>

        {/* Modal */}
        <div className='animate-in zoom-in-95 relative mx-4 w-full max-w-2xl duration-300'>
          <div className='relative rounded-3xl bg-white p-8 shadow-2xl'>
            {/* Close Button */}
            <button
              onClick={() => setShowPreview(false)}
              className='group absolute top-4 right-4 rounded-full p-2 transition-colors hover:bg-gray-100'
            >
              <svg
                className='h-6 w-6 text-gray-400 group-hover:text-gray-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>

            {/* Header */}
            <div className='mb-6 text-center'>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600'>
                <svg
                  className='h-8 w-8 text-white'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                  />
                </svg>
              </div>
              <h2 className='mb-2 text-2xl font-bold text-gray-800'>
                {t('repairStepper.ticketPreview')}
              </h2>
              <p className='text-gray-600'>{t('repairStepper.galiaTransferLabel')}</p>
            </div>

            {/* Ticket Preview */}
            {/* Ticket Preview Box */}
            <div className='mx-auto bg-white shadow-lg overflow-hidden' style={{ width: '300px', height: '300px' }}>
              <div className='h-full w-full border-2 border-black flex flex-col'>

                {/* 1. Header Section */}
                <div className='h-[15%] border-b border-black flex items-center justify-between px-2'>
                  <div className='text-3xl font-extrabold tracking-tight'>tesca</div>
                  <div className='text-2xl font-bold'>SK</div>
                </div>

                {/* 2. Lear PN Section */}
                <div className='h-[15%] border-b border-black flex items-center justify-center'>
                  <span className='text-lg font-bold'>{learPN}</span>
                </div>

                {/* 3. Barcode Section */}
                <div className='h-[50%] border-b border-black flex flex-col items-center justify-center p-1'>
                  {/* Canvas will be filled by JsBarcode */}
                  <canvas id='preview-barcode-canvas' className='h-[70%] w-[90%]'></canvas>
                  <div className='font-bold text-lg mt-1'>{ticketCode}</div>
                </div>

                {/* 4. Footer Section */}
                <div className='h-[20%] relative'>
                  <div className='flex justify-between px-2 pt-1 font-bold text-sm'>
                    <span>{t('repairStepper.oper')}: {auth.user?.matricule || t('repairStepper.nA')}</span>
                    <span>{t('repairStepper.qty')}: {qty}</span>
                  </div>
                  <div className='absolute bottom-1 w-full text-center text-[10px] text-gray-600'>
                    {t('repairStepper.date')}: {dateStr} {t('repairStepper.time')}: {timeStr}
                  </div>
                </div>

              </div>
            </div>

            {/* Action Buttons */}
            <div className='mt-8 flex justify-center gap-4'>
              <button
                onClick={() => setShowPreview(false)}
                className='rounded-xl border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50'
              >
                {t('repairStepper.close')}
              </button>
              <button
                onClick={() => {
                  setShowPreview(false)
                  generateTicketPDF(ticketCode)
                }}
                className='flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
              >
                <svg
                  className='h-5 w-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                  />
                </svg>
                {t('repairStepper.downloadAndPrint')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const generateTicketPDF = (codeToPrint = ticketCode) => {
    const doc = new jsPDF({ unit: 'cm', format: [5, 5] })
    const m = 0.2
    const w = 4.6
    const h = 4.6

    doc.setLineWidth(0.02)
    doc.setDrawColor(0)

    // Border & Grid
    doc.rect(m, m, w, h)
    doc.line(m, 0.9, m + w, 0.9)
    doc.line(m, 1.5, m + w, 1.5)
    doc.line(m, 3.9, m + w, 3.9)

    // Header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('tesca', m + 0.2, 0.7)
    doc.text('SK', m + w - 0.2, 0.7, { align: 'right' })

    // Lear PN
    doc.setFontSize(11)
    doc.text(learPN, 2.5, 1.35, { align: 'center' })

    // Barcode
    const canvas = document.createElement('canvas')
    if (codeToPrint) {
      JsBarcode(canvas, codeToPrint, {
        format: 'CODE128',
        width: 4,
        height: 80,
        displayValue: false,
        margin: 0,
      })
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', m + 0.1, 1.6, w - 0.2, 1.8)
    }

    // Ticket Code Text
    doc.setFontSize(10)
    doc.text(codeToPrint || '', 2.5, 3.75, { align: 'center' })

    // Footer
    doc.setFontSize(9)
    doc.text(`Oper: ${auth.user?.matricule}`, m + 0.1, 4.3)
    doc.text(`Qty: ${qty}`, m + w - 0.1, 4.3, { align: 'right' })

    // Date
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    const now = new Date()
    const dateStr = `Date: ${now.toLocaleDateString()} Time: ${now.toLocaleTimeString()}`
    doc.text(dateStr, 2.5, 4.7, { align: 'center' })

    // Print
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = url
    document.body.appendChild(iframe)

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
        }, 10000)
      }, 100)
    }
  }


  const progress = qty === 0 ? 0 : (barcodesLocal.length / qty) * 100

  const itemsLeft = Math.max(0, qty - barcodesLocal.length)

  return (
    <div className='mx-auto w-full max-w-4xl space-y-6 p-3 sm:space-y-8 sm:p-4 md:p-6 lg:p-8'>
      <PreviewTicket />

      {/* Header Section with Gradient */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 shadow-2xl sm:rounded-3xl sm:p-6 md:p-8'>
        <div
          className='absolute inset-0 opacity-30'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
        <div className='relative'>
          <h1 className='mb-2 flex items-center gap-2 text-xl font-bold text-white sm:gap-3 sm:text-2xl md:text-3xl'>
            <svg
              className='h-6 w-6 flex-shrink-0 sm:h-8 sm:w-8'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <span className='truncate'>{t('repairStepper.transferPreparation')}</span>
          </h1>
          <p className='ml-0 text-xs text-blue-100 sm:ml-0 sm:text-sm'>
            {t('repairStepper.transferSubtitle')}
          </p>
        </div>
      </div>

      {/* Main Barcode Collection Card */}
      <Card className='animate-in fade-in slide-in-from-bottom-4 hover:shadow-3xl overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-white to-gray-50/50 shadow-2xl backdrop-blur-sm transition-all duration-700'>
        <div className='absolute top-0 right-0 -z-10 h-64 w-64 translate-x-32 -translate-y-32 transform rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl'></div>

        <CardHeader className='pb-4'>
          <CardTitle className='flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent'>
            <svg
              className='h-6 w-6 text-blue-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z'
              />
            </svg>
            {t('repairStepper.barcodeScanner')}
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-6'>
          {itemsLeft > 0 ? (
            <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
              {/* Réf Lear Input */}
              <div className='group relative z-10 space-y-3'>
                <Label
                  htmlFor='barcode1'
                  className='flex items-center gap-2 text-sm font-semibold text-gray-700'
                >
                  <svg
                    className='h-4 w-4 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
                    />
                  </svg>
                  {t('repairStepper.refLear')}
                  <span className='text-xs font-normal text-gray-500'>
                    {t('repairStepper.refLearHint')}
                  </span>
                </Label>
                <Input
                  id='barcode1'
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
                        showError(
                          t('repairStepper.refLear15Chars'),
                          'barcode1'
                        )
                        setBarcode1('')
                      } else if (!barcode1.startsWith('L')) {
                        showError(t('repairStepper.refLearStartL'), 'barcode1')
                        setBarcode1('')
                      } else if (
                        barcode1.toLowerCase() === learPN.toLowerCase()
                      ) {
                        barcode2Ref.current?.focus()
                      } else {
                        showError(t('repairStepper.refLearMustMatchPN'), 'barcode1')
                        setBarcode1('')
                      }
                    }
                  }}
                  className={cn(
                    'h-12 rounded-xl border-2 font-mono text-base uppercase transition-all duration-300 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20',
                    shakingField === 'barcode1' &&
                    'animate-shake border-red-500 ring-4 ring-red-500/20',
                    barcode1.length > 0 &&
                    barcode1.length < 15 &&
                    'border-yellow-500 ring-2 ring-yellow-500/20',
                    barcode1.length === 15 &&
                    barcode1.startsWith('L') &&
                    'border-green-500 ring-2 ring-green-500/20'
                  )}
                  placeholder={t('repairStepper.refLearPlaceholder')}
                  maxLength={15}
                />
                <div className='flex justify-between text-xs'>
                  <span
                    className={cn(
                      'font-medium',
                      barcode1.length === 0 && 'text-gray-400',
                      barcode1.length > 0 &&
                      barcode1.length < 15 &&
                      'text-yellow-600',
                      barcode1.length === 15 && 'text-green-600'
                    )}
                  >
                    {barcode1.length}/15 {t('repairStepper.refLearLength')}
                  </span>
                  {barcode1.length > 0 && !barcode1.startsWith('L') && (
                    <span className='font-medium text-red-600'>
                      {t('repairStepper.mustStartWithL')}
                    </span>
                  )}
                </div>
              </div>

              {/* Traceability Code Input */}
              <div className='group relative z-10 space-y-3'>
                <Label
                  htmlFor='barcode2'
                  className='flex items-center gap-2 text-sm font-semibold text-gray-700'
                >
                  <svg
                    className='h-4 w-4 text-indigo-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  {t('repairStepper.traceabilityCode')}
                  <span className='text-xs font-normal text-gray-500'>
                    {t('repairStepper.traceabilityHint')}
                  </span>
                </Label>
                <Input
                  id='barcode2'
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
                        showError(
                          t('repairStepper.traceability13Chars'),
                          'barcode2'
                        )
                        setBarcode2('')
                        return
                      }
                      await handleAdd()
                    }
                  }}
                  className={cn(
                    'h-12 rounded-xl border-2 font-mono text-base uppercase transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20',
                    shakingField === 'barcode2' &&
                    'animate-shake border-red-500 ring-4 ring-red-500/20',
                    barcode2.length > 0 &&
                    barcode2.length < 13 &&
                    'border-yellow-500 ring-2 ring-yellow-500/20',
                    barcode2.length === 13 &&
                    'border-green-500 ring-2 ring-green-500/20'
                  )}
                  placeholder={
                    prefix6
                      ? t('repairStepper.traceabilityPlaceholder', { prefix: prefix6 })
                      : t('repairStepper.awaitingLearPN')
                  }
                  autoComplete='off'
                  maxLength={13}
                  disabled={!prefix6}
                />
                <div className='flex justify-between text-xs'>
                  <span
                    className={cn(
                      'font-medium',
                      barcode2.length === 0 && 'text-gray-400',
                      barcode2.length > 0 &&
                      barcode2.length < 13 &&
                      'text-yellow-600',
                      barcode2.length === 13 && 'text-green-600'
                    )}
                  >
                    {barcode2.length}/13 {t('repairStepper.refLearLength')}
                  </span>
                  {prefix6 &&
                    barcode2.length > 0 &&
                    !barcode2.startsWith(prefix6) && (
                      <span className='font-medium text-red-600'>
                        {t('repairStepper.mustStartWith', { prefix: prefix6 })}
                      </span>
                    )}
                </div>
              </div>
            </div>
          ) : (
            <div className='py-8 text-center'>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
                <svg
                  className='h-8 w-8 text-green-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              </div>
              <h3 className='mb-2 text-xl font-bold text-gray-800'>
                {t('repairStepper.allItemsScanned')}
              </h3>
              <p className='text-gray-600'>{t('repairStepper.readyToGenerate')}</p>
            </div>
          )}

          {/* Progress Card with Enhanced Design */}
          <Card className='animate-in zoom-in-95 mt-6 w-full overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg transition-all duration-500 hover:shadow-xl'>
            <div className='absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5'></div>
            <CardHeader className='relative pb-3'>
              <CardTitle className='flex items-center justify-center gap-2 text-center text-lg font-bold text-gray-800'>
                <svg
                  className='h-5 w-5 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
                {t('repairStepper.scanningProgress')}
              </CardTitle>
            </CardHeader>
            <CardContent className='relative'>
              <div className='mb-3 flex items-center justify-between text-sm font-medium'>
                <span className='flex items-center gap-2 text-gray-700'>
                  {itemsLeft > 0 ? (
                    <>
                      <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white'>
                        {itemsLeft}
                      </span>
                      {t('repairStepper.remaining')}
                    </>
                  ) : (
                    <>
                      <span className='text-2xl'>🎉</span>
                      {t('repairStepper.completeStatus')}
                    </>
                  )}
                </span>
                <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-lg font-bold text-transparent'>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className='relative'>
                <Progress
                  value={progress}
                  className='h-4 rounded-full bg-white/50 shadow-inner'
                />
                {progress === 100 && (
                  <div className='absolute inset-0 flex items-center justify-center'>
                    <span className='text-xs font-bold text-white drop-shadow-lg'>
                      {t('repairStepper.completeStatus').toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className='mt-3 flex justify-between text-xs text-gray-600'>
                <span>{barcodesLocal.length} {t('repairStepper.scanned')}</span>
                <span>{qty} {t('repairStepper.required')}</span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Traceability Codes Card */}
      {shouldShowQrSnapshot && (
        <Card className='animate-in fade-in slide-in-from-bottom-8 overflow-hidden rounded-3xl border-0 bg-white shadow-xl transition-all duration-700 hover:shadow-2xl'>
          <div className='absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500'></div>

          <CardHeader className='border-b bg-gradient-to-br from-gray-50 to-white'>
            <CardTitle className='flex items-center gap-2 text-xl font-bold text-gray-800'>
              <svg
                className='h-6 w-6 text-indigo-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
                />
              </svg>
              {t('repairStepper.collectedDataSummary')}
            </CardTitle>
          </CardHeader>

          <CardContent className='p-6'>
            <div className='rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 shadow-inner'>
              <p className='mb-4 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-500 uppercase'>
                <svg
                  className='h-4 w-4'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z'
                    clipRule='evenodd'
                  />
                </svg>
                {t('repairStepper.transferDataSnapshot')}
              </p>

              <div className='space-y-3'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  {/* Ticket Code */}
                  <div className='rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300'>
                    <p className='mb-1 text-xs font-semibold text-gray-500'>
                      {t('repairStepper.ticketCode')}
                    </p>
                    <p className='font-mono text-lg font-bold text-blue-600'>
                      {qrData.ticketCode || '—'}
                    </p>
                  </div>

                  {/* Lear PN */}
                  <div className='rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-300'>
                    <p className='mb-1 text-xs font-semibold text-gray-500'>
                      {t('repairStepper.learPN')}
                    </p>
                    <p className='font-mono text-lg font-bold text-indigo-600'>
                      {qrData.learPN || '—'}
                    </p>
                  </div>

                  {/* Date */}
                  <div className='rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-purple-300'>
                    <p className='mb-1 text-xs font-semibold text-gray-500'>
                      {t('repairStepper.dateTime')}
                    </p>
                    <p className='text-sm font-medium text-gray-800'>
                      {qrData.date
                        ? new Date(qrData.date).toLocaleString()
                        : '—'}
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className='rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-green-300'>
                    <p className='mb-1 text-xs font-semibold text-gray-500'>
                      {t('repairStepper.quantityRequired')}
                    </p>
                    <p className='text-2xl font-bold text-green-600'>
                      {qrData.qty || 0}
                    </p>
                  </div>
                </div>

                {/* Barcodes List */}
                <div className='rounded-xl border border-gray-200 bg-white p-4'>
                  <p className='mb-3 flex items-center gap-2 text-xs font-semibold text-gray-500'>
                    <svg
                      className='h-4 w-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M4 6h16M4 10h16M4 14h16M4 18h16'
                      />
                    </svg>
                    {t('repairStepper.scannedBarcodes', { count: qrData.barcodes.length })}
                  </p>
                  {qrData.barcodes.length > 0 ? (
                    <div className='custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-2'>
                      {qrData.barcodes.map(
                        (b: { barcode2: string }, index: number) => (
                          <div
                            key={`${b.barcode2}-${index}`}
                            className='flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 transition-colors hover:from-blue-100 hover:to-indigo-100'
                          >
                            <span className='inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white'>
                              {index + 1}
                            </span>
                            <span className='flex-1 font-mono text-sm font-semibold text-gray-800'>
                              {b.barcode2}
                            </span>
                            <svg
                              className='h-5 w-5 flex-shrink-0 text-green-500'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5 13l4 4L19 7'
                              />
                            </svg>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className='py-8 text-center text-gray-400'>
                      <svg
                        className='mx-auto mb-2 h-12 w-12 opacity-50'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                        />
                      </svg>
                      <p className='text-sm font-medium'>{t('repairStepper.noScansYet')}</p>
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
        <div className='animate-in fade-in zoom-in-95 px-3 text-center duration-500'>
          <div className='inline-block max-w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-xl sm:rounded-2xl sm:p-6'>
            <p className='mb-2 text-xs font-semibold text-blue-100 sm:text-sm'>
              {t('repairStepper.generatedTicketCode')}
            </p>
            <p className='font-mono text-xl font-bold tracking-wider break-all text-white sm:text-2xl md:text-3xl'>
              {ticketCode}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {progress === 100 && (
        <div className='animate-in fade-in slide-in-from-bottom-4 mt-6 flex flex-col flex-wrap justify-center gap-3 px-3 duration-700 sm:mt-8 sm:flex-row sm:gap-4'>
          <button
            onClick={() => setShowPreview(true)}
            className='group relative inline-flex w-full transform items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl active:scale-95 sm:w-auto sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base'
          >
            <svg
              className='h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 sm:h-5 sm:w-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
              />
            </svg>
            <span>Preview Ticket</span>
          </button>

          <button
            onClick={handleGenerateAndPrint}
            disabled={processing}
            className='group relative inline-flex w-full transform items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:w-auto sm:gap-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base'
          >
            <svg
              className='h-4 w-4 flex-shrink-0 transition-transform group-hover:scale-110 sm:h-5 sm:w-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z'
              />
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
