import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
      })
      if (!res.ok) {
        throw redirect({
          to: '/sign-in-2',
          search: { redirect: location.href },
        })
      }
      const data = await res.json()
      useAuthStore.getState().auth.setUser(data)

      if (data?.role === 'operateur' && location.pathname === '/') {
        throw redirect({
          to: '/reapirage',
        })
      }
    } catch (e: any) {
      if (e?.isRedirect || e?.to || (e && typeof e === 'object' && 'options' in e)) {
        throw e
      }
      throw redirect({
        to: '/sign-in-2',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})
