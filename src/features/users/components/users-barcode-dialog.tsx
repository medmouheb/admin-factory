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
      // Custom minimal margins locally
      const m = 1
      const w = 48
      const h = 48
      
      doc.setLineWidth(0.1)
      doc.setDrawColor(0)

      // Border
      doc.rect(m, m, w, h)
      
      // Header
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('tesca', m + 1, 6) // Moved up
      doc.text('LOGIN', m + w - 1, 6, { align: 'right' })

      doc.setLineWidth(0.05)
      doc.line(m, 8, m + w, 8)

      // Helper for barcode
      const getBarcodeImage = (text: string, showText: boolean) => {
        const canvas = document.createElement('canvas')
        try {
          JsBarcode(canvas, text, {
            format: 'CODE128',
            displayValue: showText,
            fontSize: 40,
            margin: 0,
            width: 4, 
            height: 100, // Source height
          })
        } catch (e) {
          return null
        }
        return canvas.toDataURL('image/png')
      }

      // User Name
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      const fullName = `${currentRow.firstName} ${currentRow.lastName}`
      doc.text(fullName, 25, 12, { align: 'center' }) // Moved up
      
      doc.line(m, 14, m + w, 14)

      // Matricule Section
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Matricule:', m + 1, 17)
      
      const matriculeImg = getBarcodeImage(currentRow.matricule, true)
      if (matriculeImg) {
        doc.addImage(matriculeImg, 'PNG', m + 1, 18, w - 2, 10) // Tcompacted
      }

      // Password Section (Maximize space here)
      if (currentRow.password) {
        doc.text('Password:', m + 1, 31)
        
        // Match Matricule style: show text (true) and consistent alignment
        const passwordImg = getBarcodeImage(currentRow.password, true)
        if (passwordImg) {
          doc.addImage(passwordImg, 'PNG', m + 1, 32, w - 2, 11) 
        }
      } else {
        doc.text('(No Password)', 25, 38, { align: 'center' })
      }

      doc.line(m, 16, m + w, 16)



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
