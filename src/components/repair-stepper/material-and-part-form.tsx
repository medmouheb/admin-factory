import { useState, useEffect, useRef } from 'react'
import { useStepper } from './stepper-config'
import { useCurrentData } from './context'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ErrorPopup } from './error-popup'

export function MaterialAndPartForm({ nextFunction }: { nextFunction: () => void }) {
  const stepper = useStepper()
  const { currentData, setCurrentData } = useCurrentData()

  const [learPN, setLearPN] = useState('')
  const [storageUnit, setStorageUnit] = useState('')
  const [part, setPart] = useState({ tescaPN: '', desc: '', qtyPerBox: '' })
  const [loading, setLoading] = useState(false)

  const learPNRef = useRef<HTMLInputElement>(null)
  const storageRef = useRef<HTMLInputElement>(null)
  const qtyRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState({ open: false, msg: '', field: '' })

  const showError = (msg: string, field: string) => {
    setError({ open: true, msg, field })
    setTimeout(() => setError((e) => ({ ...e, field: '' })), 500)
  }

  /** Restore on mount */
  useEffect(() => {
    setLearPN(currentData.part.learPN || '')
    setStorageUnit(currentData.materile.storageUn || '')
    setPart({
      tescaPN: currentData.part.tescaPN || '',
      desc: currentData.part.desc || '',
      qtyPerBox: currentData.part.qtyPerBox || '',
    })
  }, [])

  /** Autofocus if step active */
  useEffect(() => {
    if (stepper.current.id === 'ContainerManagement') {
      setTimeout(() => learPNRef.current?.focus(), 80)
    }
  }, [stepper.current.id])

  /** Sync each local → global (optimized) */
  useEffect(() => {
    setCurrentData((p) => ({ ...p, part: { ...p.part, learPN } }))
  }, [learPN])

  useEffect(() => {
    setCurrentData((p) => ({
      ...p,
      materile: { ...p.materile, storageUn: storageUnit },
    }))
  }, [storageUnit])

  useEffect(() => {
    setCurrentData((p) => ({
      ...p,
      part: { ...p.part, qtyPerBox: part.qtyPerBox },
    }))
  }, [part.qtyPerBox])

  /** Validators (shorter) */
  const isLearPNValid = () => /^p.{15}$/i.test(learPN.trim())
  const isStorageValid = () => /^s.{9}$/i.test(storageUnit.trim())
  const isPartLoaded = () => part.tescaPN.trim() && part.desc.trim()
  const isQtyValid = () => /^Q\d+$/.test(part.qtyPerBox.trim())

  /** Fetch part by Lear PN */
  const handleFetchPart = async () => {
    if (!isLearPNValid()) {
      setLearPN('')
      return showError('Lear PN must start with P and be 16 characters', 'learPN')
    }

    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8080/api/parts/lear?learPN=${learPN.substring(1)}`
      )
      if (!res.ok) throw new Error('Not found')

      const data = await res.json()
      setPart((prev) => ({
        ...prev,
        tescaPN: data.tescaPN || '',
        desc: data.desc || '',
      }))

      setCurrentData((prev) => ({
        ...prev,
        part: {
          ...prev.part,
          tescaPN: data.tescaPN || '',
          desc: data.desc || '',
        },
      }))

      toast.success('Part loaded')
      setTimeout(() => storageRef.current?.focus(), 200)
    } catch {
      showError('Part not found', 'learPN')
      setPart((prev) => ({ ...prev, tescaPN: '', desc: '' }))
      setLearPN('')
    } finally {
      setLoading(false)
    }
  }

  /** Validate HU */
  const handleStorageDone = async () => {
    if (!isStorageValid()) {
      setStorageUnit('')
      return showError('HU must start with S and be 10 chars', 'storage')
    }

    // Check if HU is unique
    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8080/api/ticketscode/check-hu-unique?hu=${storageUnit}`
      )
      if (!res.ok) throw new Error('Failed to check HU uniqueness')

      const data = await res.json()

      if (!data.isUnique) {
        setStorageUnit('')
        return showError('HU already exists. Please use a unique HU.', 'storage')
      }

      toast.success('HU accepted')
      setTimeout(() => qtyRef.current?.focus(), 200)
    } catch (error) {
      showError('Failed to validate HU uniqueness', 'storage')
      setStorageUnit('')
    } finally {
      setLoading(false)
    }
  }

  /** Final step: ENTER on quantity */
  const handleQuantityNext = () => {
    if (!isLearPNValid()) return showError('Lear PN invalid', 'learPN')
    if (!isPartLoaded()) return showError('Part not loaded', 'learPN')
    if (!isStorageValid()) return showError('HU invalid', 'storage')
    if (!isQtyValid()) return showError('Quantity must be Q<number>', 'quantity')

    setCurrentData((p) => ({ ...p, hasCompletedStep1: true }))
    nextFunction()
  }

  /** Shared ENTER handler */
  const enter = (e: any, callback: Function) => {
    if (e.key === 'Enter' && !loading) callback()
  }

  return (
    <div className='w-full p-6'>
      <Card className='w-full rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-xl transition-all border-t-4 border-t-primary'>
        <CardHeader>
          <CardTitle className='text-2xl'>Part & Material Information</CardTitle>
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
                    error.field === 'learPN' && 'animate-shake border-destructive ring-2 ring-destructive/20'
                  )}
                  ref={learPNRef}
                  value={learPN}
                  onChange={(e) => setLearPN(e.target.value)}
                  onKeyDown={(e) => enter(e, handleFetchPart)}
                  maxLength={16}
                  placeholder='Enter Lear PN (starts with P, 16 chars)'
                  autoComplete='off'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Tesca PN</Label>
                <Input className='h-12 px-4 text-lg' readOnly value={part.tescaPN} placeholder='Auto-filled' />
              </div>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Description</Label>
                <Input className='h-12 px-4 text-lg' readOnly value={part.desc} placeholder='Auto-filled' />
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
                    error.field === 'storage' && 'animate-shake border-destructive ring-2 ring-destructive/20'
                  )}
                  ref={storageRef}
                  value={storageUnit}
                  onChange={(e) => setStorageUnit(e.target.value)}
                  onKeyDown={(e) => enter(e, handleStorageDone)}
                  maxLength={10}
                  placeholder='Enter HU Galia (starts with s, 10 chars)'
                  autoComplete='off'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Quantity</Label>
                <Input
                  className={cn(
                    'h-12 px-4 text-lg',
                    error.field === 'quantity' && 'animate-shake border-destructive ring-2 ring-destructive/20'
                  )}
                  ref={qtyRef}
                  value={part.qtyPerBox}
                  onChange={(e) => setPart((prev) => ({ ...prev, qtyPerBox: e.target.value }))}
                  onKeyDown={(e) => enter(e, handleQuantityNext)}
                  placeholder='Enter Quantity (e.g. Q10)'
                  autoComplete='off'
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ErrorPopup
        open={error.open}
        onOpenChange={(o) => setError((e) => ({ ...e, open: o }))}
        message={error.msg}
      />
    </div>
  )
}
