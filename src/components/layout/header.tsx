import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { User, Moon, Sun, ChevronRight, Bell, Search } from 'lucide-react'
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
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      isLast: index === paths.length - 1
    }))
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header
      className={cn(
        'z-50 h-16 border-b-2 transition-all duration-500',
        'bg-gradient-to-r from-background via-background/95 to-background',
        'backdrop-blur-xl supports-[backdrop-filter]:bg-background/80',
        'relative overflow-hidden',
        // Animated gradient overlay
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/10 before:via-primary/5 before:to-primary/10',
        'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700',
        // Subtle shine effect
        'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent',
        'after:translate-x-[-200%] hover:after:translate-x-[200%] after:transition-transform after:duration-1000',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow-2xl shadow-primary/10 border-primary/20' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'relative flex h-full items-center gap-3 px-4 sm:px-6 sm:gap-4 transition-all duration-300',
        )}
      >
        <SidebarTrigger
          variant='ghost'
          className='max-md:scale-110 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 transition-all duration-300 hover:scale-125 hover:rotate-12
            relative overflow-hidden group
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent
            before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
            shadow-sm hover:shadow-md hover:shadow-primary/20'
        />
        <Separator orientation='vertical' className='h-6 transition-all duration-300 hover:h-8 hover:bg-gradient-to-b hover:from-primary hover:to-primary/50' />

        {/* Enhanced Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-500">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <div
                key={index}
                className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-300"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <span className={cn(
                  "transition-all duration-300 relative group px-2 py-1 rounded-md",
                  crumb.isLast
                    ? "font-semibold text-foreground bg-primary/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-pointer hover:translate-x-0.5",
                  !crumb.isLast && "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/50 after:transition-all after:duration-300 hover:after:w-full"
                )}>
                  {crumb.label}
                </span>
                {!crumb.isLast && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-all duration-300 hover:text-primary hover:translate-x-0.5 hover:scale-110" />
                )}
              </div>
            ))
          ) : (
            <span className="font-semibold text-foreground animate-in fade-in zoom-in duration-500 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1 rounded-lg">Dashboard</span>
          )}
        </div>

        {children}

        <div className="ml-auto flex items-center gap-2">
          {/* Enhanced Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 transition-all duration-300 hover:scale-110 hover:rotate-3 relative overflow-hidden group
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
              shadow-sm hover:shadow-md hover:shadow-primary/20"
            title="Search"
            onClick={() => setOpen((prev) => !prev)}
          >
            <Search className="h-4 w-4 transition-all duration-300 group-hover:scale-110" />
          </Button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Enhanced Notifications */}

          {/* Enhanced Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-gradient-to-br hover:from-primary/10 hover:to-primary/5 transition-all duration-300 hover:scale-110 hover:rotate-12 relative overflow-hidden group
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/30 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
              shadow-sm hover:shadow-md hover:shadow-primary/20"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 transition-all duration-500 rotate-0 scale-100 animate-in spin-in-180 group-hover:rotate-90 group-hover:scale-110" />
            ) : (
              <Moon className="h-4 w-4 transition-all duration-500 rotate-0 scale-100 animate-in spin-in-180 group-hover:-rotate-12 group-hover:scale-110" />
            )}
          </Button>

          <Separator orientation='vertical' className='h-6 mx-1 transition-all duration-300 hover:h-8 hover:bg-gradient-to-b hover:from-primary hover:to-primary/50' />

          {/* Enhanced User Info */}
          {auth.user && (
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-muted/80 to-muted/50 px-3 py-2 transition-all duration-300 hover:from-muted hover:to-muted/80 hover:shadow-lg hover:shadow-primary/10 cursor-pointer group
              relative overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
              border border-border/50 hover:border-primary/30">
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm transition-all duration-300 group-hover:text-primary group-hover:translate-x-[-2px]">
                    {auth.user.matricule}
                  </span>
                  <span className="rounded-full bg-gradient-to-br from-primary to-primary/70 px-2.5 py-0.5 text-xs font-medium text-primary-foreground shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/30">
                    {auth.user.role || 'User'}
                  </span>
                </div>
                {auth.user.matricule && (
                  <span className="text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                    ID: {auth.user.matricule}
                  </span>
                )}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-primary-foreground shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg group-hover:shadow-primary/30">
                <User className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
