import { type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from './types'

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const href = useLocation({ select: (location) => location.href })
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 mb-2">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} index={index} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} index={index} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return (
    <Badge className='rounded-full px-2 py-0.5 text-xs bg-primary/10 text-primary border-primary/20 font-medium animate-in zoom-in duration-300 hover:scale-110 transition-transform'>
      {children}
    </Badge>
  )
}

function SidebarMenuLink({ item, href, index }: { item: NavLink; href: string; index: number }) {
  const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item)
  
  return (
    <SidebarMenuItem 
      className="animate-in fade-in slide-in-from-left-2 duration-300"
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
    >
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={`
          group relative overflow-hidden transition-all duration-300
          hover:bg-primary/5 hover:text-primary hover:shadow-sm
          ${isActive ? 'bg-primary/10 text-primary font-medium shadow-sm' : ''}
          before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/10 before:to-transparent
          before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
        `}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {isActive && (
            <>
              <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary/60 rounded-r animate-in slide-in-from-left-1 duration-300" />
              <span className="absolute left-0 top-0 h-full w-1 bg-primary/50 rounded-r animate-pulse" />
            </>
          )}
          {item.icon && (
            <item.icon className={`
              transition-all duration-300 
              group-hover:scale-110 group-hover:rotate-3
              ${isActive ? 'text-primary animate-in zoom-in duration-300' : ''}
            `} />
          )}
          <span className="transition-all duration-300 group-hover:translate-x-0.5">{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
  index,
}: {
  item: NavCollapsible
  href: string
  index: number
}) {
  const { setOpenMobile } = useSidebar()
  const isActive = checkIsActive(href, item, true)
  
  return (
    <Collapsible
      asChild
      defaultOpen={isActive}
      className='group/collapsible'
    >
      <SidebarMenuItem
        className="animate-in fade-in slide-in-from-left-2 duration-300"
        style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            tooltip={item.title}
            className={`
              group relative overflow-hidden transition-all duration-300
              hover:bg-primary/5 hover:text-primary
              ${isActive ? 'bg-primary/10 text-primary font-medium' : ''}
            `}
          >
            {isActive && (
              <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-primary/60 rounded-r" />
            )}
            {item.icon && (
              <item.icon className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
            )}
            <span className="transition-all duration-300">{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180 group-hover:text-primary' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className="border-l-2 border-border/50 ml-3 pl-2">
            {item.items.map((subItem, subIndex) => {
              const subIsActive = checkIsActive(href, subItem)
              return (
                <SidebarMenuSubItem 
                  key={subItem.title}
                  className="animate-in fade-in slide-in-from-left-1 duration-200"
                  style={{ animationDelay: `${subIndex * 20}ms`, animationFillMode: 'backwards' }}
                >
                  <SidebarMenuSubButton
                    asChild
                    isActive={subIsActive}
                    className={`
                      group relative transition-all duration-300
                      hover:bg-primary/5 hover:text-primary hover:translate-x-1
                      ${subIsActive ? 'bg-primary/10 text-primary font-medium' : ''}
                    `}
                  >
                    <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                      {subItem.icon && (
                        <subItem.icon className={`transition-transform duration-300 group-hover:scale-110 ${subIsActive ? 'text-primary' : ''}`} />
                      )}
                      <span className="transition-all duration-300">{subItem.title}</span>
                      {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
            className="hover:bg-primary/5 hover:text-primary transition-all duration-300"
          >
            {item.icon && <item.icon className="transition-transform duration-300 hover:scale-110" />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          side='right' 
          align='start' 
          sideOffset={4}
          className="animate-in fade-in slide-in-from-left-2 duration-200"
        >
          <DropdownMenuLabel className="font-semibold">
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem 
              key={`${sub.title}-${sub.url}`} 
              asChild
              className="cursor-pointer transition-colors duration-200"
            >
              <Link
                to={sub.url}
                className={`${checkIsActive(href, sub) ? 'bg-primary/10 text-primary font-medium' : ''}`}
              >
                {sub.icon && <sub.icon className="mr-2 h-4 w-4" />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
