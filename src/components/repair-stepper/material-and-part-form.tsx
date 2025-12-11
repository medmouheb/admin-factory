import { useState, useEffect, useRef } from 'react'
import { useStepper } from './stepper-config'
import { useCurrentData } from './context'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function MaterialAndPartForm({ nextFunction }: { nextFunction: () => void }) {
  const { t } = useTranslation()
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
    setError({ open: false, msg, field })
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
  const isQtyValid = () => /^Q\d{1,3}$/.test(part.qtyPerBox.trim())

  /** Fetch part by Lear PN */
  const handleFetchPart = async () => {
    if (!isLearPNValid()) {
      setLearPN('')
      return showError(t('repairStepper.learPNInvalid'), 'learPN')
    }

    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8080/api/parts/lear?learPN=${learPN.substring(1)}`,
        { credentials: 'include' }
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

      toast.success(t('repairStepper.partLoaded'))
      setTimeout(() => storageRef.current?.focus(), 200)
    } catch {
      showError(t('repairStepper.partNotFound'), 'learPN')
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
      return showError(t('repairStepper.huInvalid'), 'storage')
    }

    // Check if HU is unique
    setLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8080/api/ticketscode/check-hu-unique?hu=${storageUnit}`, {
        credentials: 'include',   // ⬅️ VERY IMPORTANT
      }
      )
      if (!res.ok) throw new Error('Failed to check HU uniqueness')

      const data = await res.json()

      if (!data.isUnique) {
        setStorageUnit('')
        return showError(t('repairStepper.huExists'), 'storage')
      }

      toast.success(t('repairStepper.huAccepted'))
      setTimeout(() => qtyRef.current?.focus(), 200)
    } catch (error) {
      showError(t('repairStepper.huValidationFailed'), 'storage')
      setStorageUnit('')
    } finally {
      setLoading(false)
    }
  }

  /** Final step: ENTER on quantity */
  const handleQuantityNext = () => {
    if (!isLearPNValid()) return showError(t('repairStepper.learPNInvalidError'), 'learPN')
    if (!isPartLoaded()) return showError(t('repairStepper.partNotLoadedError'), 'learPN')
    if (!isStorageValid()) return showError(t('repairStepper.huInvalid'), 'storage')
    if (!isQtyValid()) {
      part.qtyPerBox = ""
      return showError(t('repairStepper.quantityInvalid'), 'quantity')

    }

    setCurrentData((p) => ({ ...p, hasCompletedStep1: true }))
    nextFunction()
  }

  /** Shared ENTER handler */
  const enter = (e: any, callback: Function) => {
    if (e.key === 'Enter' && !loading) callback()
  }

  return (
    <div className='mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8'>
      {/* Header Section with Gradient */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 p-8 shadow-2xl'>
        <div className='absolute inset-0 opacity-30' style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className='relative'>
          <h1 className='text-3xl font-bold text-white mb-2 flex items-center gap-3'>
            <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' />
            </svg>
            {t('repairStepper.partMaterialInfo')}
          </h1>
          <p className='text-purple-100 text-sm'>{t('repairStepper.partMaterialSubtitle')}</p>
        </div>
      </div>

      {/* Main Form Card */}
      <Card className='rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-3xl transition-all border-0 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm overflow-hidden'>
        <div className='absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl -z-10 transform translate-x-48 -translate-y-48'></div>

        <CardHeader className='pb-6'>
          <CardTitle className='text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2'>
            <svg className='w-6 h-6 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
            </svg>
            {t('repairStepper.dataEntryForm')}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
            {/* PART SECTION */}
            <div className='space-y-6'>
              <div className='flex items-center gap-3 pb-4 border-b-2 border-gradient-to-r from-indigo-200 to-purple-200'>
                <div className='p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-gray-800'>{t('repairStepper.partInformation')}</h3>
              </div>

              {/* Lear PN */}
              <div className='space-y-3 group'>
                <Label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-indigo-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                  </svg>
                  {t('repairStepper.learPN')}
                  <span className='text-xs text-gray-500 font-normal'>{t('repairStepper.pressEnterToFetch')}</span>
                </Label>
                <Input
                  className={cn(
                    'h-14 px-4 text-base font-mono border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-indigo-300',
                    error.field === 'learPN' && 'animate-shake border-red-500 ring-4 ring-red-500/20'
                  )}
                  ref={learPNRef}
                  value={learPN}
                  onChange={(e) => setLearPN(e.target.value)}
                  onKeyDown={(e) => enter(e, handleFetchPart)}
                  maxLength={16}
                  placeholder={t('repairStepper.learPNPlaceholder')}
                  autoComplete='off'
                  disabled={loading}
                />
                <p className='text-xs text-gray-500 flex items-center gap-1'>
                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                  {t('repairStepper.learPNHint')}
                </p>
              </div>

              {/* Tesca PN */}
              <div className='space-y-3'>
                <Label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' />
                  </svg>
                  {t('repairStepper.tescaPN')}
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                    {t('repairStepper.autoFilled')}
                  </span>
                </Label>
                <div className='relative'>
                  <Input
                    className='h-14 px-4 text-base font-mono bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl cursor-not-allowed'
                    readOnly
                    value={part.tescaPN}
                    placeholder={t('repairStepper.willBeFilledAuto')}
                  />
                  {part.tescaPN && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      <svg className='w-5 h-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className='space-y-3'>
                <Label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-pink-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16m-7 6h7' />
                  </svg>
                  {t('repairStepper.description')}
                  <span className='inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800'>
                    {t('repairStepper.autoFilled')}
                  </span>
                </Label>
                <div className='relative'>
                  <Input
                    className='h-14 px-4 text-base bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl cursor-not-allowed'
                    readOnly
                    value={part.desc}
                    placeholder={t('repairStepper.willBeFilledAuto')}
                  />
                  {part.desc && (
                    <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                      <svg className='w-5 h-5 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MATERIAL SECTION */}
            <div className='space-y-6'>
              <div className='flex items-center gap-3 pb-4 border-b-2 border-gradient-to-r from-blue-200 to-cyan-200'>
                <div className='p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' />
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-gray-800'>{t('repairStepper.materialInformation')}</h3>
              </div>

              {/* HU Galia */}
              <div className='space-y-3 group'>
                <Label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' />
                  </svg>
                  {t('repairStepper.huGalia')}
                  <span className='text-xs text-gray-500 font-normal'>{t('repairStepper.pressEnterToValidate')}</span>
                </Label>
                <Input
                  className={cn(
                    'h-14 px-4 text-base font-mono border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-300',
                    error.field === 'storage' && 'animate-shake border-red-500 ring-4 ring-red-500/20'
                  )}
                  ref={storageRef}
                  value={storageUnit}
                  onChange={(e) => setStorageUnit(e.target.value)}
                  onKeyDown={(e) => enter(e, handleStorageDone)}
                  maxLength={10}
                  placeholder={t('repairStepper.huPlaceholder')}
                  autoComplete='off'
                  disabled={loading}
                />
                <p className='text-xs text-gray-500 flex items-center gap-1'>
                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                  {t('repairStepper.huHint')}
                </p>
              </div>

              {/* Quantity */}
              <div className='space-y-3 group'>
                <Label className='text-sm font-semibold text-gray-700 flex items-center gap-2'>
                  <svg className='w-4 h-4 text-cyan-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 20l4-16m2 16l4-16M6 9h14M4 15h14' />
                  </svg>
                  {t('repairStepper.quantity')}
                  <span className='text-xs text-gray-500 font-normal'>{t('repairStepper.pressEnterToContinue')}</span>
                </Label>
                <Input
                  className={cn(
                    'h-14 px-4 text-base font-mono border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-500 hover:border-cyan-300',
                    error.field === 'quantity' && 'animate-shake border-red-500 ring-4 ring-red-500/20'
                  )}
                  ref={qtyRef}
                  value={part.qtyPerBox}
                  onChange={(e) => setPart((prev) => ({ ...prev, qtyPerBox: e.target.value }))}
                  onKeyDown={(e) => enter(e, handleQuantityNext)}
                  placeholder={t('repairStepper.quantityPlaceholder')}
                  autoComplete='off'
                  disabled={loading}
                />
                <p className='text-xs text-gray-500 flex items-center gap-1'>
                  <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                  {t('repairStepper.quantityHint')}
                </p>
              </div>

              {/* Loading Indicator */}
              {loading && (
                <div className='mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 animate-pulse'>
                  <div className='flex items-center gap-3'>
                    <div className='w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin'></div>
                    <p className='text-sm font-semibold text-indigo-700'>{t('repairStepper.processing')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Summary Card */}
          {(part.tescaPN || storageUnit || part.qtyPerBox) && (
            <div className='mt-8 p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 shadow-inner animate-in fade-in zoom-in-95 duration-500'>
              <h4 className='text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2'>
                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                </svg>
                {t('repairStepper.formStatus')}
              </h4>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center p-3 rounded-lg bg-white border border-gray-200'>
                  <div className={cn(
                    'w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center',
                    isLearPNValid() && isPartLoaded() ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    {isLearPNValid() && isPartLoaded() ? (
                      <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                  </div>
                  <p className='text-xs font-semibold text-gray-600'>{t('repairStepper.partInfo')}</p>
                </div>
                <div className='text-center p-3 rounded-lg bg-white border border-gray-200'>
                  <div className={cn(
                    'w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center',
                    isStorageValid() ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    {isStorageValid() ? (
                      <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                  </div>
                  <p className='text-xs font-semibold text-gray-600'>{t('repairStepper.huGalia')}</p>
                </div>
                <div className='text-center p-3 rounded-lg bg-white border border-gray-200'>
                  <div className={cn(
                    'w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center',
                    isQtyValid() ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    {isQtyValid() ? (
                      <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                  </div>
                  <p className='text-xs font-semibold text-gray-600'>{t('repairStepper.quantity')}</p>
                </div>
                <div className='text-center p-3 rounded-lg bg-white border border-gray-200'>
                  <div className={cn(
                    'w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center',
                    isLearPNValid() && isPartLoaded() && isStorageValid() && isQtyValid() ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    {isLearPNValid() && isPartLoaded() && isStorageValid() && isQtyValid() ? (
                      <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    ) : (
                      <svg className='w-5 h-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                  </div>
                  <p className='text-xs font-semibold text-gray-600'>{t('repairStepper.ready')}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add custom styles */}
      <style>{`
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
