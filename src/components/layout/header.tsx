import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth-store'
import { User, Moon, Sun, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-provider'
import { useLocation } from '@tanstack/react-router'

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const { auth } = useAuthStore()
  const { theme, setTheme } = useTheme()
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
        'z-50 h-16 border-b transition-all duration-500',
        'bg-gradient-to-r from-background via-background to-background/95',
        'backdrop-blur-md supports-[backdrop-filter]:bg-background/60',
        'relative overflow-hidden',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:via-transparent before:to-primary/5',
        'before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-700',
        fixed && 'header-fixed peer/header sticky top-0 w-[inherit]',
        offset > 10 && fixed ? 'shadow-lg shadow-primary/5' : 'shadow-none',
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
          className='max-md:scale-110 hover:bg-primary/10 transition-all duration-300 hover:scale-110 hover:rotate-12
            relative overflow-hidden
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent
            before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500'
        />
        <Separator orientation='vertical' className='h-6 transition-all duration-300 hover:h-8 hover:bg-primary/50' />

        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2 duration-500">
          {breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, index) => (
              <div
                key={index}
                className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-300"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <span className={cn(
                  "transition-all duration-300 relative group",
                  crumb.isLast
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-primary cursor-pointer hover:translate-x-0.5",
                  !crumb.isLast && "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                )}>
                  {crumb.label}
                </span>
                {!crumb.isLast && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-all duration-300 hover:text-primary hover:translate-x-0.5" />
                )}
              </div>
            ))
          ) : (
            <span className="font-medium text-foreground animate-in fade-in zoom-in duration-500">Dashboard</span>
          )}
        </div>

        {children}

        <div className="ml-auto flex items-center gap-2">


          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-primary/10 transition-all duration-300 hover:scale-110 hover:rotate-12 relative overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 transition-all duration-500 rotate-0 scale-100 animate-in spin-in-180" />
            ) : (
              <Moon className="h-4 w-4 transition-all duration-500 rotate-0 scale-100 animate-in spin-in-180" />
            )}
          </Button>

          <Separator orientation='vertical' className='h-6 mx-1' />

          {/* User Info */}
          {auth.user && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 transition-all duration-300 hover:bg-muted hover:shadow-md cursor-pointer group
              relative overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700">
              <div className="hidden sm:flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm transition-all duration-300 group-hover:text-primary">
                    {auth.user.username}
                  </span>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md">
                    {auth.user.role?.[0] || 'User'}
                  </span>
                </div>
                {auth.user.matricule && (
                  <span className="text-xs text-muted-foreground transition-colors duration-300 group-hover:text-foreground">
                    ID: {auth.user.matricule}
                  </span>
                )}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md">
                <User className="h-4 w-4 transition-transform duration-300" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
