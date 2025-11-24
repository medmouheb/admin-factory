import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    try {
      const res = await fetch('http://localhost:8080/api/auth/session', {
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
    } catch {
      throw redirect({
        to: '/sign-in-2',
        search: { redirect: location.href },
      })
    }
  },
  component: AuthenticatedLayout,
})
