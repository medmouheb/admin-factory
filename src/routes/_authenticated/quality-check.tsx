import { createFileRoute } from '@tanstack/react-router'
import QualityCheckStepper from '@/components/QualityCheckStepper'

export const Route = createFileRoute('/_authenticated/quality-check')({
  component: QualityCheckStepper,
})
