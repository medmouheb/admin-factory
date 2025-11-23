import { createFileRoute } from '@tanstack/react-router'
import RetouchPacketsList from '@/components/RetouchPacketsList'

export const Route = createFileRoute('/_authenticated/retouch-packets')({
    component: RetouchPacketsList,
})
