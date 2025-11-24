import { CurrentDataProvider } from './context'
import { StepperInner } from './stepper-inner'
import RetouchPacketsList from '../RetouchPacketsList'

export default function StepperFull() {
  return (
    <CurrentDataProvider>
      <div className='space-y-8'>
        <StepperInner />
        <RetouchPacketsList />
      </div>
    </CurrentDataProvider>
  )
}
