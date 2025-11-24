import React, { useState, useEffect, useRef, useMemo } from 'react'
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
  const [availStock, setAvailStock] = useState('')
  const [part, setPart] = useState({ tescaPN: '', desc: '', qtyPerBox: '' })
  const [loading, setLoading] = useState(false)

  const learPNRef = useRef<HTMLInputElement>(null)
  const storageRef = useRef<HTMLInputElement>(null)
  const availRef = useRef<HTMLInputElement>(null)

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
    if (stepper.current.id === 'ContainerManagement')
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
      // const qtyStr = data.qtyPerBox != null ? String(data.qtyPerBox) : ''
      setPart(prev => ({
        ...prev,
        tescaPN: data.tescaPN || '',
        desc: data.desc || '',
        // qtyPerBox: qtyStr, // Do not overwrite quantity
      }))
      setCurrentData((prev) => ({
        ...prev,
        part: {
          learPN: pn,
          tescaPN: data.tescaPN || '',
          desc: data.desc || '',
          qtyPerBox: prev.part.qtyPerBox, // Keep existing quantity
        },
      }))
      toast.success('Part loaded')
      setTimeout(() => storageRef.current?.focus(), 250)
    } catch {
      showError('Part not found', 'learPN')
      setPart(prev => ({ ...prev, tescaPN: '', desc: '' }))
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
    part.tescaPN.trim() && part.desc.trim()
  const isStorageValid = () =>
    storageUnit.trim().length === 10 &&
    storageUnit.trim().toLowerCase().startsWith('s')
  const isAvailValid = () => /^Q\d+$/.test(part.qtyPerBox)

  // auto-next only first time
  useEffect(() => {
    if (
      isLearPNValid() &&
      isPartFetched() &&
      isStorageValid() &&
      isAvailValid() &&
      !currentData.hasCompletedStep1
    ) {
      // We don't auto-next on quantity anymore, user must hit enter
      // But if they come back and everything is valid, maybe?
      // For now, let's respect the "hit enter" request for the last field.
    }
  }, [learPN, part, storageUnit])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: string) => {
    if (e.key !== 'Enter' || loading) return
    if (type === 'part') handleFetchPart()
    if (type === 'storage') handleStorageDone()
    if (type === 'quantity') {
      if (isAvailValid()) {
        setCurrentData((prev) => ({ ...prev, hasCompletedStep1: true }))
        nextFunction()
      } else {
        showError('Quantity must be in format Q<number> (e.g. Q10)', 'quantity')
      }
    }
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
                  autoComplete='off'
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
                  autoComplete='off'
                />
              </div>

              <div className='space-y-2'>
                <Label className='text-lg font-medium'>Quantity</Label>
                <Input
                  className='h-12 px-4 text-lg'
                  ref={availRef}
                  value={part.qtyPerBox}
                  onChange={(e) => setPart(prev => ({ ...prev, qtyPerBox: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, 'quantity')}
                  placeholder='Enter Quantity (e.g. Q10)'
                  autoComplete='off'
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
