import { useMemo } from 'react'
import { useStepper, steps, utils } from './stepper-config'
import { useCurrentData } from './context'
import { Stepper, Step } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MaterialAndPartForm } from './material-and-part-form'
import { TransferPrepComponent } from './transfer-prep'

export function StepperInner() {
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
      <div className='mx-auto max-w-7xl rounded-3xl bg-white/60 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/60 dark:bg-slate-900/60 dark:ring-slate-800 md:p-10'>
        <div className='mb-10 flex items-center justify-between border-b border-slate-200/60 pb-6 dark:border-slate-800'>
          <div>
            <h2 className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent'>
              Reapirage Process
            </h2>
            <p className='text-muted-foreground mt-2 text-lg'>
              Follow the steps to complete the check.
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <span className='rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'>
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
            <div className='min-h-[400px] overflow-hidden'>
              <div
                key={stepper.current.id}
                className='animate-in fade-in slide-in-from-right-8 duration-500'
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

            {!stepper.isLast ? (
              <div className='flex justify-center gap-6 pt-8'>
                <Button
                  variant='secondary'
                  onClick={stepper.prev}
                  disabled={stepper.isFirst}
                  className='w-40 rounded-full shadow-md transition-all hover:scale-105 hover:shadow-lg'
                >
                  Back
                </Button>
                <Button
                  onClick={stepper.next}
                  disabled={
                    (stepper.current.id === 'ContainerManagement' &&
                      !isStep1Valid)
                    // || (stepper.current.id === 'ImpactAnalysis' && !isStep2Valid)
                  }
                  className='w-40 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md transition-all hover:scale-105 hover:shadow-lg hover:from-blue-700 hover:to-indigo-700'
                >
                  {stepper.isLast ? 'Complete' : 'Next'}
                </Button>
              </div>
            ) : (
              <div className='flex justify-center pt-8'>
                <Button
                  onClick={handleFullReset}
                  className='w-40 rounded-full bg-gradient-to-r from-red-500 to-pink-600 shadow-md transition-all hover:scale-105 hover:shadow-lg hover:from-red-600 hover:to-pink-700'
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
