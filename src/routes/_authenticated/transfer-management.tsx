import { createFileRoute } from '@tanstack/react-router'
import TransferManagement from '@/components/TransferManagement'

export const Route = createFileRoute('/_authenticated/transfer-management')({
    component: TransferManagement,
})
