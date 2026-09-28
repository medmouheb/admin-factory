import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useAuthStore } from '@/stores/auth-store'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useAuthStore((state) => state.auth)

  const checkAccess = (itemRoles: string[] | undefined) => {
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
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className="border-r-0 [--sidebar-background:transparent]"
      style={{
        background: 'linear-gradient(180deg, #1a1040 0%, #0f0c29 40%, #0d1b3e 100%)',
      }}
    >
      {/* Decorative top gradient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.35) 0%, transparent 70%)',
        }}
      />

      {/* Side accent line */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 via-indigo-500/20 to-transparent pointer-events-none" />

      <SidebarHeader className="border-b border-white/[0.06] pb-3 pt-4">
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-white/[0.06] pt-3">
        {/* Bottom glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 100%, rgba(99,102,241,0.2) 0%, transparent 70%)',
          }}
        />
        <NavUser user={navUser} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
