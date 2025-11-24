import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
// import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useAuthStore } from '@/stores/auth-store'


export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useAuthStore((state) => state.auth)
    const { auth } = useAuthStore()


  const checkAccess = (itemRoles: string[] | undefined) => {
    console.log("auth in sidebar:", auth);
    
    if (!itemRoles || itemRoles.length === 0) return true
    if (!user || !user.role) return false
    return itemRoles.some((role) => user.role.includes(role))
  }

  const filteredNavGroups = sidebarData.navGroups
    .filter((group) => checkAccess(group.roles))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => checkAccess(item.roles)),
    }))
    .filter((group) => group.items.length > 0)

  const navUser = {
    name: user?.username || 'User',
    email: user?.matricule || user?.email || 'user@example.com',
    avatar: '/avatars/shadcn.jpg',
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
