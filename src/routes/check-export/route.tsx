import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import StepperFull from '@/components/repair-stepper'

export const Route = createFileRoute('/check-export')({
  component: RouteComponent,
})

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function RouteComponent() {
  if (!PUBLISHABLE_KEY) {
    return <MissingClerkPubKey />
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl='/clerk/sign-in'
      signInUrl='/clerk/sign-in'
      signUpUrl='/clerk/sign-up'
      signInFallbackRedirectUrl='/clerk/user-management'
      signUpFallbackRedirectUrl='/clerk/user-management'
    >
      <Outlet />
    </ClerkProvider>
  )
}

function MissingClerkPubKey() {
  return (
    <AuthenticatedLayout>
      <StepperFull />
    </AuthenticatedLayout>
  )
}
