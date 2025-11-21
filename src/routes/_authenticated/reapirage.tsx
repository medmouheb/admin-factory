
import { createFileRoute } from '@tanstack/react-router'
import StepperFull from '@/components/stepper'

export const Route = createFileRoute('/_authenticated/reapirage')({
  component: StepperFull,
})

