import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

type TeamSwitcherProps = {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}

export function TeamSwitcher({ teams }: TeamSwitcherProps) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-gradient-to-br data-[state=open]:from-sidebar-accent data-[state=open]:to-sidebar-accent/50 data-[state=open]:text-sidebar-accent-foreground
                transition-all duration-300 hover:bg-gradient-to-br hover:from-sidebar-accent/80 hover:to-sidebar-accent/40
                group relative overflow-hidden
                before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent
                before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
                shadow-sm hover:shadow-md hover:shadow-primary/10'
            >
              <div className='bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg group-hover:shadow-primary/20'>
                <activeTeam.logo className='size-4 transition-transform duration-300 group-hover:scale-110' />
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5'>
                  {activeTeam.name}
                </span>
                <span className='truncate text-xs transition-colors duration-300 group-hover:text-foreground'>{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className='ms-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-12' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg shadow-xl border-2 animate-in fade-in slide-in-from-top-2 duration-300'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs uppercase tracking-wider font-semibold'>
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className='gap-2 p-2 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 cursor-pointer
                  relative overflow-hidden group
                  before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent
                  before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500
                  animate-in fade-in slide-in-from-left-1 duration-200'
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
              >
                <div className='flex size-6 items-center justify-center rounded-sm border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:border-primary/50 group-hover:shadow-sm'>
                  <team.logo className='size-4 shrink-0 transition-transform duration-300 group-hover:scale-110' />
                </div>
                <span className='transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-primary'>{team.name}</span>
                <DropdownMenuShortcut className='transition-all duration-300 group-hover:text-primary group-hover:font-semibold'>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2 transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 cursor-pointer
              relative overflow-hidden group
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500'>
              <div className='bg-background flex size-6 items-center justify-center rounded-md border transition-all duration-300 group-hover:scale-110 group-hover:border-primary/50 group-hover:shadow-sm'>
                <Plus className='size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110' />
              </div>
              <div className='text-muted-foreground font-medium transition-all duration-300 group-hover:text-primary group-hover:translate-x-0.5'>Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
