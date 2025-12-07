import { getRouteApi } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Main } from '@/components/layout/main'
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
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6 p-4 md:p-8 pt-6">
        {/* Enhanced Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-6 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="relative flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">User Management</h1>
              </div>
              <p className="text-purple-100 text-sm sm:text-base ml-0 sm:ml-14">
                Manage system users and their permissions.
              </p>
            </div>
            <UsersPrimaryButtons />
          </div>
        </div>

        {/* Enhanced Search Card */}
        <div className="rounded-2xl border-2 bg-gradient-to-br from-white to-gray-50/50 p-4 sm:p-6 shadow-lg">
          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Quick Search
            </span>
            <AutocompleteSearch
              users={allUsers}
              onSelect={handleUserSelect}
              placeholder="Search users by name, matricule, or email..."
            />
          </div>
        </div>

        <UsersTable data={[]} search={search} navigate={navigate} roleFilter={roleFilter} />
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
