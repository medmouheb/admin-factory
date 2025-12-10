import { useMemo } from 'react'
import { useStepper, steps, utils } from './stepper-config'
import { useCurrentData } from './context'
import { Button } from '@/components/ui/button'
import { MaterialAndPartForm } from './material-and-part-form'
import { TransferPrepComponent } from './transfer-prep'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export function StepperInner() {
  const { t } = useTranslation()
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
    const isAvail = part.qtyPerBox && !isNaN(Number(part.qtyPerBox))
    return isLearPN && isPartLoaded && isStorage && isAvail
  }, [currentData])

  const isStep2Valid = useMemo(() => {
    const { repair } = currentData
    return repair?.codePiece?.trim().length > 0
  }, [currentData])

  return (
    <div className='min-h-[calc(100vh-2rem)] w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:p-8'>
      <div className='mx-auto max-w-7xl rounded-3xl bg-white/80 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/80 dark:bg-slate-900/80 dark:ring-slate-800 md:p-10'>
        {/* Enhanced Header */}
        <div className='mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 shadow-xl'>
          <div className='absolute inset-0 opacity-20' style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className='relative flex items-center justify-between'>
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <div className='p-2 rounded-xl bg-white/20 backdrop-blur-sm'>
                  <svg className='w-8 h-8 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' />
                  </svg>
                </div>
                <h2 className='text-4xl font-bold text-white tracking-tight'>
                  {t('repairStepper.title')}
                </h2>
              </div>
              <p className='text-blue-100 text-base ml-14'>
                {t('repairStepper.subtitle')}
              </p>
            </div>
            <div className='flex items-center gap-3'>
              <div className='rounded-2xl bg-white/20 backdrop-blur-sm px-6 py-3 shadow-lg border border-white/30'>
                <div className='text-xs font-semibold text-blue-100 mb-1'>{t('repairStepper.progress')}</div>
                <div className='text-2xl font-bold text-white'>
                  {t('repairStepper.step')} {currentIndex + 1} / {steps.length}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Horizontal Step Cards - Top Section */}
        <div className='mb-8'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto'>
            {stepper.all.map((step, index) => {
              const isActive = currentIndex === index
              const isCompleted = currentIndex > index
              const isDisabled =
                (index === 1 && !isStep1Valid) ||
                (index === 2 && (!isStep1Valid || !isStep2Valid))

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (isDisabled) return
                    stepper.goTo(step.id)
                  }}
                  disabled={isDisabled}
                  className={cn(
                    'relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 group overflow-hidden text-left',
                    isActive && 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-2xl scale-105 ring-4 ring-blue-200',
                    !isActive && isCompleted && 'bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl hover:scale-102 border-2 border-green-300',
                    !isActive && !isCompleted && !isDisabled && 'bg-white hover:shadow-xl hover:scale-102 border-2 border-gray-200',
                    isDisabled && 'bg-gray-50 border-2 border-gray-100 opacity-50 cursor-not-allowed'
                  )}
                >
                  {isActive && (
                    <div className='absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer'></div>
                  )}

                  <div className='relative flex items-start gap-4'>
                    {/* Step Number/Icon */}
                    <div className={cn(
                      'flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl transition-all shadow-lg',
                      isActive && 'bg-white/20 text-white',
                      isCompleted && 'bg-green-500 text-white',
                      !isActive && !isCompleted && !isDisabled && 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700',
                      isDisabled && 'bg-gray-200 text-gray-400'
                    )}>
                      {isCompleted ? (
                        <svg className='w-7 h-7 sm:w-8 sm:h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={3} d='M5 13l4 4L19 7' />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Step Content */}
                    <div className='flex-1 min-w-0'>
                      <h3 className={cn(
                        'font-bold text-lg sm:text-xl mb-1 sm:mb-2 transition-colors',
                        isActive && 'text-white',
                        isCompleted && 'text-green-700',
                        !isActive && !isCompleted && !isDisabled && 'text-gray-800',
                        isDisabled && 'text-gray-400'
                      )}>
                        {step.title}
                      </h3>
                      <p className={cn(
                        'text-sm sm:text-base transition-colors',
                        isActive && 'text-blue-100',
                        isCompleted && 'text-green-600',
                        !isActive && !isCompleted && !isDisabled && 'text-gray-600',
                        isDisabled && 'text-gray-400'
                      )}>
                        {step.description}
                      </p>
                    </div>

                    {/* Status Indicator */}
                    {isActive && (
                      <div className='flex-shrink-0 hidden sm:block'>
                        <div className='w-3 h-3 rounded-full bg-white animate-pulse'></div>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Content Area - Centered */}
        <div className='flex flex-col gap-6'>
          <div className='min-h-[400px] overflow-hidden'>
            <div
              key={stepper.current.id}
              className='animate-in fade-in slide-in-from-bottom-8 duration-500'
            >
              {stepper.switch({
                ContainerManagement: () => (
                  <MaterialAndPartForm nextFunction={stepper.next} />
                ),
                // ImpactAnalysis: () => (
                //   <ImpactAnalysisForm nextFunction={stepper.next} />
                // ),
                TransferPrep: () => <TransferPrepComponent />,
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          {!stepper.isLast ? (
            <div className='flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-3 pt-6 sm:pt-8'>
              <Button
                variant='outline'
                onClick={stepper.prev}
                disabled={stepper.isFirst}
                className='group relative w-full sm:w-40 h-12 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:hover:scale-100'
              >
                <svg className='w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                </svg>
                {t('repairStepper.back')}
              </Button>
              <Button
                onClick={stepper.next}
                disabled={
                  (stepper.current.id === 'ContainerManagement' &&
                    !isStep1Valid)
                  // || (stepper.current.id === 'ImpactAnalysis' && !isStep2Valid)
                }
                className='group relative w-full sm:w-40 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:hover:scale-100'
              >
                {stepper.isLast ? t('repairStepper.complete') : t('repairStepper.next')}
                <svg className='w-5 h-5 ml-2 transition-transform group-hover:translate-x-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                </svg>
              </Button>
            </div>
          ) : (
            <div className='flex justify-center pt-6 sm:pt-8 px-3'>
              <Button
                onClick={handleFullReset}
                className='group relative w-full sm:w-48 h-14 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:from-green-700 hover:to-emerald-700 text-lg font-semibold'
              >
                <svg className='w-6 h-6 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                </svg>
                {t('repairStepper.newPacket')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
