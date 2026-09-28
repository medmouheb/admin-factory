import { getRouteApi } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Main } from '@/components/layout/main'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { AutocompleteSearch } from './components/autocomplete-search'
import { useAuthStore } from '@/stores/auth-store'
import { type User } from './data/schema'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  Users as UsersIcon,
  CreditCard,
  Briefcase,
  Shield,
  Search,
  Sparkles,
  TrendingUp,
  Activity,
} from 'lucide-react'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { user } = useAuthStore((state) => state.auth)
  const [allUsers, setAllUsers] = useState<User[]>([])

  // Role-based filtering
  // Admin sees all users, superviseur sees only operateurs
  const roleFilter = user?.role === 'superviseur' ? 'operateur' : undefined

  // Fetch all users for autocomplete and fast stats
  useEffect(() => {
    async function fetchAllUsers() {
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('size', '1000')
        if (roleFilter) params.set('role', roleFilter)

        const res = await fetch(`/api/users/search?${params.toString()}`, {
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
    navigate({
      search: (prev) => ({
        ...prev,
        username: selectedUser.matricule,
      }),
    })
    toast.success(
      `${t('users.showingResultsFor') || 'Résultats pour'} ${selectedUser.firstName} ${selectedUser.lastName}`
    )
  }

  // Quick Stats calculations
  const stats = useMemo(() => {
    const total = allUsers.length
    const operateurs = allUsers.filter((u) => (u.role || '').toLowerCase() === 'operateur').length
    const superviseurs = allUsers.filter((u) => (u.role || '').toLowerCase() === 'superviseur').length
    const admins = allUsers.filter(
      (u) =>
        (u.role || '').toLowerCase() === 'admin' ||
        (u.role || '').toLowerCase() === 'superadmin'
    ).length

    return {
      total,
      operateurs,
      superviseurs,
      admins,
      opRate: total > 0 ? Math.round((operateurs / total) * 100) : 0,
    }
  }, [allUsers])

  const handleRoleQuickFilter = (roleName: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        role: [roleName],
        page: 1,
      }),
    })
  }

  return (
    <UsersProvider>
      <Main className="relative mx-auto max-w-7xl space-y-6 overflow-hidden">
        {/* Animated Background Ambience Orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(99,102,241,0.08) 50%, transparent 70%)',
            animation: 'orb-pulse 10s ease-in-out infinite',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-[35%] -left-48 h-[550px] w-[550px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(217,70,239,0.18) 0%, rgba(139,92,246,0.06) 50%, transparent 70%)',
            animation: 'orb-pulse 14s ease-in-out infinite',
            animationDelay: '3s',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-36 right-[20%] h-[480px] w-[480px] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(99,102,241,0.05) 55%, transparent 70%)',
            animation: 'orb-pulse 12s ease-in-out infinite',
            animationDelay: '1.5s',
          }}
        />

        {/* Subtle grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.8) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
          {/* ── 1. Hero Header Banner (Belle format & Animations) ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/70 via-purple-950/50 to-slate-950/70 p-6 md:p-8 text-white shadow-2xl shadow-purple-950/40 backdrop-blur-2xl"
          >
            {/* Top iridescent light bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent" />

            {/* Glowing top radial shine */}
            <div
              className="pointer-events-none absolute top-0 left-1/4 right-1/4 h-32"
              style={{
                background:
                  'radial-gradient(ellipse 70% 50% at 50% -20%, rgba(168,85,247,0.35) 0%, transparent 75%)',
              }}
            />

            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/15 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-md border border-violet-400/30 shadow-sm text-violet-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Administration & Gestion des Comptes</span>
                  <Sparkles className="h-3 w-3 text-violet-300 ml-0.5" />
                </div>

                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3 drop-shadow-md">
                  <span className="bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent">
                    {t('users.title') || 'Gestion des Utilisateurs'}
                  </span>
                </h1>

                <p className="max-w-2xl text-xs md:text-sm text-violet-200/80 font-normal leading-relaxed">
                  {t('users.subtitle') ||
                    'Consultez, recherchez et administrez les comptes opérateurs, superviseurs et administrateurs du système.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <UsersPrimaryButtons />
              </div>
            </div>
          </motion.div>

          {/* ── 2. Interactive KPI Stat Cards (Belle format) ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Total Users */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-[rgba(18,14,50,0.7)] p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-300/80">
                  Total Répertoire
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/25 text-violet-300 border border-violet-500/30">
                  <UsersIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.total}
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  <Activity className="h-3 w-3" /> Actifs
                </span>
              </div>
            </motion.div>

            {/* Operateurs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => handleRoleQuickFilter('operateur')}
              className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-[rgba(14,20,54,0.7)] p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300/80">
                  Opérateurs
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/25 text-blue-300 border border-blue-500/30 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.operateurs}
                </span>
                <span className="text-xs font-semibold text-blue-400">
                  {stats.opRate}% du total
                </span>
              </div>
            </motion.div>

            {/* Superviseurs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => handleRoleQuickFilter('superviseur')}
              className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-[rgba(24,14,56,0.7)] p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/80">
                  Superviseurs
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/25 text-purple-300 border border-purple-500/30 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.superviseurs}
                </span>
                <span className="text-xs font-semibold text-purple-400">
                  Responsables
                </span>
              </div>
            </motion.div>

            {/* Admins */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ y: -3, scale: 1.01 }}
              onClick={() => handleRoleQuickFilter('admin')}
              className="relative overflow-hidden rounded-2xl border border-rose-500/25 bg-[rgba(30,12,42,0.7)] p-4 sm:p-5 backdrop-blur-xl shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-300/80">
                  Administrateurs
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600/25 text-rose-300 border border-rose-500/30 group-hover:scale-105 transition-transform">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {stats.admins}
                </span>
                <span className="text-xs font-semibold text-rose-400">
                  Privilèges max
                </span>
              </div>
            </motion.div>
          </div>

          {/* ── 3. Quick Search Bar Capsule (Cosmic Glass) ── */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="rounded-2xl border border-violet-500/25 bg-[rgba(16,12,44,0.75)] p-3.5 sm:p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-violet-400" />
                {t('users.quickSearch') || 'Recherche Rapide Instantanée (Matricule, Nom, Téléphone)'}
              </span>
              <AutocompleteSearch
                users={allUsers}
                onSelect={handleUserSelect}
                placeholder={
                  t('users.searchPlaceholder') ||
                  'Tapez un matricule, nom d’utilisateur, email ou numéro de téléphone...'
                }
              />
            </div>
          </motion.div>

          {/* ── 4. Main Users Table with Filters ── */}
          <UsersTable
            data={allUsers}
            allUsers={allUsers}
            search={search}
            navigate={navigate}
            roleFilter={roleFilter}
          />
        </Main>

        <UsersDialogs />
    </UsersProvider>
  )
}
