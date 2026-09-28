import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { User, Moon, Sun, ChevronRight, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-provider'
import { useSearch } from '@/context/search-provider'
import { useLocation } from '@tanstack/react-router'
import { LanguageSwitcher } from '@/components/language-switcher'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const { auth } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const { setOpen } = useSearch()
  const [offset, setOffset] = useState(0)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () =>
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      isLast: index === paths.length - 1,
    }))
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header
      className={cn(
        'z-50 h-16 transition-all duration-500',
        'relative overflow-hidden',

        /* Deep dark glass base */
        'bg-[rgba(13,11,38,0.80)] backdrop-blur-2xl',
        'supports-[backdrop-filter]:bg-[rgba(13,11,38,0.65)]',

        /* Gradient border bottom */
        'border-b border-white/[0.06]',

        /* Shadow when scrolled */
        offset > 10 && fixed
          ? 'shadow-[0_8px_32px_rgba(99,102,241,0.15)] border-b border-indigo-500/20'
          : '',

        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        className
      )}
      {...props}
    >
      {/* Iridescent top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 opacity-80" />

      {/* Subtle background shimmer */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(139,92,246,0.4) 0%, transparent 50%, rgba(6,182,212,0.3) 100%)',
        }}
      />

      <div className="relative flex h-full items-center gap-3 px-4 sm:px-6 sm:gap-4">
        {/* Sidebar trigger */}
        <SidebarTrigger
          variant="ghost"
          className="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-300 hover:scale-110 rounded-xl"
        />

        <Separator orientation="vertical" className="h-5 bg-white/10" />

        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-1.5 text-sm animate-in fade-in slide-in-from-left-2 duration-500">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-300',
                    crumb.isLast
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5 cursor-pointer'
                  )}
                >
                  {crumb.label}
                </span>
                {!crumb.isLast && (
                  <ChevronRight className="h-3.5 w-3.5 text-white/25" />
                )}
              </div>
            ))
          ) : (
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Dashboard
            </span>
          )}
        </div>

        {children}

        <div className="ml-auto flex items-center gap-1.5">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-110"
            title="Search"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Language */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all hover:scale-110 hover:rotate-12"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-all duration-500" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-300 transition-all duration-500" />
            )}
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1 bg-white/10" />

          {/* User info pill */}
          {auth.user && (
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer group transition-all duration-300
                bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] hover:border-indigo-500/40
                hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]"
            >
              <div className="hidden sm:flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white/90 text-sm group-hover:text-white transition-colors">
                    {auth.user.matricule}
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-indigo-500/30">
                    {auth.user.role || 'User'}
                  </span>
                </div>
                {auth.user.matricule && (
                  <span className="text-[10px] text-white/35 font-mono">
                    ID: {auth.user.matricule}
                  </span>
                )}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-500/60 group-hover:shadow-xl">
                <User className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
