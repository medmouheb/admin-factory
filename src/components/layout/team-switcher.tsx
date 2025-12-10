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

        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
