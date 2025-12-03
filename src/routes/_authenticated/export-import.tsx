import { createFileRoute } from '@tanstack/react-router'
import ExportImportView from '@/features/export-import/components/export-import-view'

export const Route = createFileRoute('/_authenticated/export-import')({
    component: ExportImportView,
})
