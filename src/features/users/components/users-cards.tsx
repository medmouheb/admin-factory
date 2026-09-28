import { useState } from 'react'
import { motion } from 'framer-motion'
import { type User } from '../data/schema'
import { useUsers } from './users-provider'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User as UserIcon,
  Shield,
  Briefcase,
  Mail,
  Phone,
  Barcode,
  UserPen,
  Trash2,
  Copy,
  Check,
  MoreVertical,
  Activity,
  Calendar,
} from 'lucide-react'

interface UsersCardsProps {
  users: User[]
  isFetching?: boolean
  hasActiveFilters?: boolean
  onResetFilters?: () => void
}

function RoleBadge({ role }: { role: string }) {
  const normalizedRole = (role || '').toLowerCase()

  let styleClass = 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  let Icon = UserIcon

  if (normalizedRole === 'admin' || normalizedRole === 'superadmin') {
    styleClass = 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-sm shadow-rose-950/40'
    Icon = Shield
  } else if (normalizedRole === 'superviseur') {
    styleClass = 'bg-purple-500/15 text-purple-300 border-purple-500/30 shadow-sm shadow-purple-950/40'
    Icon = Briefcase
  } else if (normalizedRole === 'operateur') {
    styleClass = 'bg-blue-500/15 text-blue-300 border-blue-500/30 shadow-sm shadow-blue-950/40'
    Icon = UserIcon
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize transition-colors',
        styleClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{role || 'Utilisateur'}</span>
    </span>
  )
}

function UserCard({ user }: { user: User }) {
  const { t } = useTranslation()
  const { setOpen, setCurrentRow } = useUsers()
  const [copied, setCopied] = useState(false)

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'
  const initial = (user.firstName?.[0] || user.lastName?.[0] || 'U').toUpperCase()
  const normalizedRole = (user.role || '').toLowerCase()

  const handleCopyMatricule = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(user.matricule)
    setCopied(true)
    toast.success(`${t('users.matricule') || 'Matricule'} copié : ${user.matricule}`)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleAvatarGradients =
    normalizedRole === 'admin' || normalizedRole === 'superadmin'
      ? 'from-rose-500 to-red-600 shadow-rose-500/25'
      : normalizedRole === 'superviseur'
      ? 'from-purple-500 to-indigo-600 shadow-purple-500/25'
      : 'from-blue-500 to-cyan-600 shadow-blue-500/25'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-violet-500/25 bg-[rgba(18,14,46,0.75)] p-5 backdrop-blur-xl shadow-xl shadow-purple-950/20 hover:border-violet-400/50 hover:shadow-2xl hover:shadow-violet-900/30 transition-all duration-300"
    >
      {/* Top glowing ambient accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all"
      />

      {/* ── Top Header: Avatar + Name + Action Menu ── */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white font-extrabold text-lg shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300',
                roleAvatarGradients
              )}
            >
              {initial}
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-white text-base leading-tight truncate group-hover:text-violet-200 transition-colors">
                {fullName}
              </h3>
              {/* Matricule pill with copy */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-xs font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-md">
                  #{user.matricule}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMatricule}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Copier matricule"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-violet-500/30 text-white">
              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(user)
                  setOpen('edit')
                }}
                className="cursor-pointer hover:bg-violet-600/30"
              >
                <UserPen className="mr-2 h-4 w-4 text-violet-400" />
                <span>{t('users.edit') || 'Modifier'}</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(user)
                  setOpen('barcode')
                }}
                className="cursor-pointer hover:bg-violet-600/30"
              >
                <Barcode className="mr-2 h-4 w-4 text-cyan-400" />
                <span>{t('users.generateBarcode') || 'Code-barres'}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-violet-500/20" />

              <DropdownMenuItem
                onClick={() => {
                  setCurrentRow(user)
                  setOpen('delete')
                }}
                className="text-rose-400 hover:bg-rose-500/20 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4 text-rose-400" />
                <span>{t('users.delete') || 'Supprimer'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Role & Status Line ── */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-violet-500/15">
          <RoleBadge role={user.role} />

          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Actif</span>
          </div>
        </div>

        {/* ── Contact Details ── */}
        <div className="space-y-2 text-xs">
          {/* Email */}
          <div className="flex items-center gap-2.5 text-slate-300">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <Mail className="h-3.5 w-3.5" />
            </div>
            {user.email && user.email !== '-' ? (
              <a
                href={`mailto:${user.email}`}
                className="truncate hover:text-sky-300 hover:underline transition-colors"
                title={user.email}
              >
                {user.email}
              </a>
            ) : (
              <span className="text-slate-500 italic">Non renseigné</span>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2.5 text-slate-300">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Phone className="h-3.5 w-3.5" />
            </div>
            {user.phone && user.phone !== '-' ? (
              <span className="font-mono font-medium text-emerald-300">
                {user.phone}
              </span>
            ) : (
              <span className="text-slate-500 italic">Non renseigné</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Card Action Footer ── */}
      <div className="mt-5 pt-3 border-t border-violet-500/15 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCurrentRow(user)
            setOpen('barcode')
          }}
          className="flex-1 h-8 rounded-xl text-xs font-semibold bg-violet-500/10 border-violet-500/30 text-violet-200 hover:bg-violet-500/25 hover:text-white transition-all cursor-pointer"
        >
          <Barcode className="h-3.5 w-3.5 mr-1.5 text-cyan-400" />
          <span>Code-barres</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentRow(user)
            setOpen('edit')
          }}
          className="h-8 w-8 p-0 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
          title={t('users.edit') || 'Modifier'}
        >
          <UserPen className="h-3.5 w-3.5 text-violet-400" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setCurrentRow(user)
            setOpen('delete')
          }}
          className="h-8 w-8 p-0 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/15"
          title={t('users.delete') || 'Supprimer'}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-violet-500/15 bg-[rgba(18,14,46,0.5)] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-2xl bg-violet-600/20" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-28 rounded bg-violet-500/20" />
          <div className="h-3 w-16 rounded bg-violet-500/10" />
        </div>
      </div>
      <div className="h-6 w-20 rounded-full bg-violet-500/15 mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-violet-500/10" />
        <div className="h-3 w-2/3 rounded bg-violet-500/10" />
      </div>
      <div className="mt-5 pt-3 border-t border-violet-500/10 flex gap-2">
        <div className="h-8 flex-1 rounded-xl bg-violet-500/15" />
        <div className="h-8 w-8 rounded-xl bg-violet-500/10" />
      </div>
    </div>
  )
}

export function UsersCards({
  users,
  isFetching,
  hasActiveFilters,
  onResetFilters,
}: UsersCardsProps) {
  const { t } = useTranslation()

  if (isFetching) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-violet-500/25 bg-[rgba(15,11,38,0.85)] p-12 text-center backdrop-blur-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
            <UserIcon className="w-8 h-8" />
          </div>
          <span className="font-bold text-slate-200 text-lg">
            {t('users.noUsersFound') || 'Aucun utilisateur trouvé'}
          </span>
          <p className="text-xs text-slate-400 max-w-sm">
            Aucun compte ne correspond à vos filtres ou à votre recherche actuelle.
          </p>
          {hasActiveFilters && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
