import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { SearchProvider } from '@/context/search-provider'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    return (
      <>
        <SearchProvider>
          <NavigationProgress />
          <Outlet />
          <Toaster
            toastOptions={{
              classNames: {
                toast: 'text-lg py-4 px-6 rounded-xl',
                title: 'font-semibold text-xl',
                description: 'text-base',
              },
            }}
            duration={10000}
          />
        </SearchProvider>
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
