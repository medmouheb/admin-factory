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
import { useTranslation } from 'react-i18next'

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { t } = useTranslation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest px-3 mb-3 mt-2
        transition-all duration-300 hover:text-primary hover:tracking-wider hover:translate-x-0.5
        relative
        after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-gradient-to-r after:from-transparent after:via-border after:to-transparent
        after:opacity-50">
        {t(title)}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={pathname} index={index} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={pathname} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={pathname} index={index} />
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
  const { t } = useTranslation()
  const isActive = checkIsActive(href, item)

  return (
    <SidebarMenuItem
      className="animate-in fade-in slide-in-from-left-2 duration-300"
      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
    >
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={t(item.title)}
        className={`
          group relative overflow-hidden transition-all duration-300 rounded-lg
          hover:bg-gradient-to-r hover:from-primary/10 hover:via-primary/5 hover:to-transparent
          hover:text-primary hover:shadow-sm hover:translate-x-1
          ${isActive ? 'bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 text-primary font-semibold shadow-md border-l-4 border-primary' : 'border-l-4 border-transparent'}
          before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent
          before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
          after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-gradient-to-b after:from-primary after:to-primary/50
          after:scale-y-0 hover:after:scale-y-100 after:transition-transform after:duration-300 after:origin-top
        `}
      >
        <Link to={item.url} onClick={() => setOpenMobile(false)}>
          {isActive && (
            <>
              <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/50 rounded-r animate-in slide-in-from-left-1 duration-300 shadow-lg shadow-primary/50" />
              <span className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent animate-pulse" />
            </>
          )}
          {item.icon && (
            <item.icon className={`
              transition-all duration-300 
              group-hover:scale-125 group-hover:rotate-6 group-hover:text-primary
              ${isActive ? 'text-primary scale-110 animate-in zoom-in duration-300 drop-shadow-md' : ''}
            `} />
          )}
          <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">
            {t(item.title)}
          </span>
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
  const { t } = useTranslation()
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
            tooltip={t(item.title)}
            className={`
              group relative overflow-hidden transition-all duration-300 rounded-lg
              hover:bg-gradient-to-r hover:from-primary/10 hover:via-primary/5 hover:to-transparent
              hover:text-primary hover:translate-x-1
              ${isActive ? 'bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 text-primary font-semibold border-l-4 border-primary' : 'border-l-4 border-transparent'}
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-primary/20 before:to-transparent
              before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700
            `}
          >
            {isActive && (
              <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/50 rounded-r shadow-lg shadow-primary/50" />
            )}
            {item.icon && (
              <item.icon className={`transition-all duration-300 group-hover:scale-125 group-hover:rotate-6 ${isActive ? 'text-primary scale-110 drop-shadow-md' : ''}`} />
            )}
            <span className="transition-all duration-300 group-hover:translate-x-1 group-hover:font-medium">{t(item.title)}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-all duration-300 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180 group-hover:text-primary group-hover:scale-110' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub className="border-l-2 border-primary/20 ml-3 pl-2 relative
            before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
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
                      group relative transition-all duration-300 rounded-md
                      hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:text-primary hover:translate-x-2
                      ${subIsActive ? 'bg-gradient-to-r from-primary/15 to-primary/5 text-primary font-medium shadow-sm' : ''}
                      before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary/30
                      before:scale-0 hover:before:scale-100 before:transition-transform before:duration-300
                    `}
                  >
                    <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                      {subItem.icon && (
                        <subItem.icon className={`transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${subIsActive ? 'text-primary scale-105' : ''}`} />
                      )}
                      <span className="transition-all duration-300 group-hover:font-medium">{t(subItem.title)}</span>
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
