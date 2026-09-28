import { createFileRoute, redirect } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated/')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState().auth
    if (user?.role === 'operateur') {
      throw redirect({
        to: '/reapirage',
      })
    }
  },
  component: Dashboard,
})
