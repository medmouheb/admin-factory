
import { createFileRoute } from '@tanstack/react-router'
import StepperFull from '@/components/repair-stepper/index'

export const Route = createFileRoute('/_authenticated/scannage')({
  component: StepperFull,
})

