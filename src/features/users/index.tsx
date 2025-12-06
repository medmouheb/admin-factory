import { getRouteApi } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { AutocompleteSearch } from './components/autocomplete-search'
import { useAuthStore } from '@/stores/auth-store'
import { type User } from './data/schema'
import { toast } from 'sonner'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { user } = useAuthStore((state) => state.auth)
  const [allUsers, setAllUsers] = useState<User[]>([])

  // Role-based filtering
  // Admin sees all users, superviseur sees only operateurs
  const roleFilter = user?.role === 'superviseur' ? 'operateur' : undefined

  // Fetch all users for autocomplete
  useEffect(() => {
    async function fetchAllUsers() {
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('size', '1000')
        if (roleFilter) params.set('role', roleFilter)
        
        const res = await fetch(`http://localhost:8080/api/users/search?${params.toString()}`, {
          credentials: 'include',
        })
        if (!res.ok) return
        
        const json = await res.json()
        const list = Array.isArray(json?.users) ? json.users : []
        setAllUsers(
          list.map((u: any) => ({
            id: String(u.id),
            matricule: u.matricule ?? '',
            email: u.email ?? '',
            phone: u.phone ?? '',
            role: u.role,
            firstName: u.firstName ?? '',
            lastName: u.lastName ?? '',
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
            password: u.password,
          }))
        )
      } catch (e) {
        console.error('Failed to fetch users for autocomplete', e)
      }
    }
    fetchAllUsers()
  }, [roleFilter])

  const handleUserSelect = (selectedUser: User) => {
    // Filter the table by the selected user's matricule
    navigate({
      search: (prev) => ({
        ...prev,
        username: selectedUser.matricule,
      }),
    })
    toast.success(`Showing results for ${selectedUser.firstName} ${selectedUser.lastName}`)
  }

  return (
    <UsersProvider>
      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-4'>
          <div className="flex-1 min-w-[200px] max-w-md">
            <h2 className='text-2xl font-bold tracking-tight mb-2'>User List</h2>
            <AutocompleteSearch
              users={allUsers}
              onSelect={handleUserSelect}
              placeholder='Search users by name, matricule, or email...'
            />
          </div>
          <UsersPrimaryButtons />
        </div>
        <UsersTable data={[]} search={search} navigate={navigate} roleFilter={roleFilter} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
