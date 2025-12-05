import { useState, useEffect, useRef } from 'react'
import { useUsers } from './users-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function UsersBarcodeDialog() {
  const { open, setOpen, currentRow } = useUsers()
  const [loading, setLoading] = useState(false)
  
  const matriculeCanvasRef = useRef<HTMLCanvasElement>(null)
  const passwordCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleClose = () => {
    setOpen(null)
  }

  const generatePDF = () => {
    if (!currentRow) return
    setLoading(true)

    try {
      // 50mm x 50mm format
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [50, 50],
      })

      // Helper to generate barcode image
      const getBarcodeImage = (text: string, showText: boolean) => {
        const canvas = document.createElement('canvas')
        JsBarcode(canvas, text, {
          format: 'CODE128',
          displayValue: showText,
          fontSize: 40,
          margin: 0,
        })
        return canvas.toDataURL('image/png')
      }

      // Layout matching the image
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const fullName = `User: ${currentRow.firstName} ${currentRow.lastName}`
      doc.text(fullName, 5, 8) // Top left

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Matricule:', 5, 14)

      // Matricule Barcode (With text below)
      const matriculeImg = getBarcodeImage(currentRow.matricule, true)
      doc.addImage(matriculeImg, 'PNG', 5, 16, 40, 12)

      // Password Label
      doc.text('Password:', 5, 34)

      // Password Barcode (Without text below)
      if (currentRow.password) {
        const passwordImg = getBarcodeImage(currentRow.password, false)
        doc.addImage(passwordImg, 'PNG', 5, 36, 40, 10)
      } else {
        doc.setFontSize(8)
        doc.text('(No password)', 5, 40)
      }

      // Print
      doc.autoPrint()
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      iframe.onload = () => {
        iframe.contentWindow?.print()
      }

      toast.success('Printing ticket...')
    } catch (error) {
      console.error('Ticket generation error', error)
      toast.error('Failed to generate ticket')
    } finally {
      setLoading(false)
    }
  }

  // Auto-print when dialog opens
  useEffect(() => {
    if (open === 'barcode' && currentRow) {
      const timer = setTimeout(() => {
        generatePDF()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [open, currentRow])

  // Effect for preview canvases
  useEffect(() => {
    if (open === 'barcode' && currentRow) {
      if (matriculeCanvasRef.current) {
        try {
          JsBarcode(matriculeCanvasRef.current, currentRow.matricule, {
            format: 'CODE128',
            displayValue: true,
            fontSize: 14,
            margin: 10,
            width: 2,
            height: 50,
          })
        } catch (e) { console.error(e) }
      }
      
      if (passwordCanvasRef.current && currentRow.password) {
        try {
          JsBarcode(passwordCanvasRef.current, currentRow.password, {
            format: 'CODE128',
            displayValue: false,
            fontSize: 14,
            margin: 10,
            width: 2,
            height: 50,
          })
        } catch (e) { console.error(e) }
      }
    }
  }, [open, currentRow])

  return (
    <Dialog open={open === 'barcode'} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Print User Ticket</DialogTitle>
          <DialogDescription>
            Printing ticket for {currentRow?.firstName}...
          </DialogDescription>
        </DialogHeader>
        
        <div className='grid gap-6 py-4'>
          <div className='space-y-2'>
            <Label>Matricule Barcode</Label>
            <div className='border rounded-md p-4 flex justify-center bg-white'>
              <canvas ref={matriculeCanvasRef} className='max-w-full' />
            </div>
            <p className='text-sm text-muted-foreground text-center'>{currentRow?.matricule}</p>
          </div>

          {currentRow?.password ? (
            <div className='space-y-2 animate-in fade-in slide-in-from-top-2'>
              <Label>Password Barcode</Label>
              <div className='border rounded-md p-4 flex justify-center bg-white'>
                <canvas ref={passwordCanvasRef} className='max-w-full' />
              </div>
              <p className='text-sm text-muted-foreground text-center'>*Hidden*</p>
            </div>
          ) : (
             <div className='text-center text-muted-foreground italic'>
               No password available to print.
             </div>
          )}
        </div>

        <DialogFooter>
          <Button type='button' variant='secondary' onClick={handleClose}>
            Close
          </Button>
          <Button type='button' onClick={generatePDF} disabled={loading}>
            {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Download className='mr-2 h-4 w-4' />}
            Reprint Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
