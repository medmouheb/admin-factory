import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useAuthStore } from '@/stores/auth-store'
import { AdminDashboard } from './components/admin-dashboard'
import { UserDashboard } from './components/user-dashboard'
import { OperatorDashboard } from './components/operator-dashboard'

export function Dashboard() {
  const { auth } = useAuthStore()
  const isAdmin = auth.user?.role?.includes('admin')
  const isOperator = auth.user?.role?.includes('operateur') || auth.user?.role?.includes('opperateur')

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center space-x-4'>
          <Search />
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        {isAdmin ? <AdminDashboard /> : isOperator ? <OperatorDashboard /> : <UserDashboard />}
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Overview',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  }
]
