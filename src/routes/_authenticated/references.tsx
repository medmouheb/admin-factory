import { createFileRoute } from '@tanstack/react-router'
import { AddReferenceForm } from '@/features/references'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/references')({
  component: ReferencesPage,
})

function ReferencesPage() {
  return (
    <Main>
      <div className='mb-2 flex items-center justify-between space-y-2'>
        <h1 className='text-2xl font-bold tracking-tight'>References</h1>
      </div>
      <div className='flex flex-1 flex-col space-y-4'>
        <AddReferenceForm />
      </div>
    </Main>
  )
}
