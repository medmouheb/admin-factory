import { CurrentDataProvider } from './context'
import { StepperInner } from './stepper-inner'

export default function StepperFull({ client }: { client?: 'lear' | 'serbia' | null }) {
  return (
    <CurrentDataProvider initialClient={client}>
      <div className='space-y-8'>
        <StepperInner />
      </div>
    </CurrentDataProvider>
  )
}
