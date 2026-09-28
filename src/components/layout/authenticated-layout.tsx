import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProfileDropdown } from '@/components/profile-dropdown'

type AuthenticatedLayoutProps = {
  children?: React.ReactNode
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <SkipToMain />
        <AppSidebar />

        <SidebarInset
          className={cn(
            '@container/content',
            'has-data-[layout=fixed]:h-svh',
            'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]',
            'flex flex-col',
            'relative overflow-hidden',
          )}
          style={{
            /* Deep space navy gradient background — matches sidebar */
            background:
              'linear-gradient(135deg, #0d0b26 0%, #0f0c2e 35%, #0a1628 70%, #0d0b26 100%)',
          }}
        >
          {/* ── Animated ambient orbs ─────────────────── */}
          {/* Top-right — vivid indigo */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-72 -right-72 h-[700px] w-[700px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(99,102,241,0.08) 45%, transparent 70%)',
              animation: 'orb-pulse 9s ease-in-out infinite',
            }}
          />
          {/* Mid-left — violet */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[25%] -left-56 h-[560px] w-[560px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.06) 50%, transparent 72%)',
              animation: 'orb-pulse 13s ease-in-out infinite',
              animationDelay: '2s',
            }}
          />
          {/* Bottom-right — cyan */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 right-[5%] h-[500px] w-[500px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(6,182,212,0.05) 50%, transparent 72%)',
              animation: 'orb-pulse 11s ease-in-out infinite',
              animationDelay: '1s',
            }}
          />
          {/* Bottom-left — rose */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(244,63,94,0.12) 0%, rgba(244,63,94,0.03) 55%, transparent 72%)',
              animation: 'orb-pulse 15s ease-in-out infinite',
              animationDelay: '4s',
            }}
          />
          {/* Centre — emerald accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[20%] left-[40%] h-[280px] w-[280px] rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)',
              animation: 'orb-pulse 17s ease-in-out infinite',
              animationDelay: '6s',
            }}
          />

          {/* Subtle dot-grid overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              opacity: 0.035,
              backgroundImage:
                'radial-gradient(rgba(139,92,246,0.9) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* ── Content ───────────────────────────────── */}
          <Header>
            <div className="ms-auto flex items-center space-x-4">
              <ProfileDropdown />
            </div>
          </Header>

          <div className="relative z-10 flex-1 animate-in fade-in zoom-in-95 duration-500">
            {children ?? <Outlet />}
          </div>

          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  )
}
