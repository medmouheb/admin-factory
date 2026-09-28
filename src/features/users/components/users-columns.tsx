import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/data-table'
import { roles } from '../data/data'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { useTranslation } from 'react-i18next'
import { Copy, Check, User as UserIcon, Shield, Briefcase, Hash, Mail, Phone } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

function MatriculeCell({ matricule }: { matricule: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(matricule)
    setCopied(true)
    toast.success(`Matricule copié : ${matricule}`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
        {matricule}
      </span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-violet-600 rounded cursor-pointer"
        title="Copier le matricule"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const normalizedRole = (role || '').toLowerCase()

  let styleClass = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
  let Icon = UserIcon

  if (normalizedRole === 'admin' || normalizedRole === 'administrateur') {
    styleClass = 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40 shadow-rose-500/10'
    Icon = Shield
  } else if (normalizedRole === 'superviseur') {
    styleClass = 'bg-purple-50 text-purple-700 border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40 shadow-purple-500/10'
    Icon = Briefcase
  } else if (normalizedRole === 'operateur') {
    styleClass = 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40 shadow-blue-500/10'
    Icon = UserIcon
  }

  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm transition-transform cursor-default capitalize',
        styleClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{role}</span>
    </motion.span>
  )
}

export function useUsersColumns(): ColumnDef<User>[] {
  const { t } = useTranslation()

  return [
    {
      accessorKey: 'matricule',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 font-bold text-xs">
            #
          </span>
          <DataTableColumnHeader column={column} title={t('users.matricule')} />
        </div>
      ),
      cell: ({ row }) => <MatriculeCell matricule={row.getValue('matricule')} />,
      enableHiding: false,
    },
    {
      id: 'fullName',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-purple-600" />
          <DataTableColumnHeader column={column} title={t('users.name')} />
        </div>
      ),
      cell: ({ row }) => {
        const { firstName, lastName } = row.original
        const fullName = `${firstName || ''} ${lastName || ''}`.trim() || '-'
        const initial = (firstName?.[0] || lastName?.[0] || 'U').toUpperCase()

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-extrabold text-xs shadow-md shadow-purple-500/20">
              {initial}
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              {fullName}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-fuchsia-600" />
          <DataTableColumnHeader column={column} title={t('users.email')} />
        </div>
      ),
      cell: ({ row }) => {
        const email = row.getValue('email') as string
        return email ? (
          <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            {email}
          </span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">-</span>
        )
      },
      filterFn: (row, id, value: string[]) => {
        if (!value || !value.length) return true
        const email = (row.getValue(id) as string || '').trim()
        const hasEmail = email && email !== '-'
        if (value.includes('hasEmail') && !value.includes('noEmail')) {
          return Boolean(hasEmail)
        }
        if (value.includes('noEmail') && !value.includes('hasEmail')) {
          return !hasEmail
        }
        return true
      },
    },
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-violet-600" />
          <DataTableColumnHeader column={column} title={t('users.phoneNumber')} />
        </div>
      ),
      cell: ({ row }) => {
        const phone = row.getValue('phone') as string
        return phone ? (
          <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
            {phone}
          </span>
        ) : (
          <span className="text-slate-300 dark:text-slate-600">-</span>
        )
      },
      filterFn: (row, id, value: string[]) => {
        if (!value || !value.length) return true
        const phone = (row.getValue(id) as string || '').trim()
        const hasPhone = phone && phone !== '-'
        if (value.includes('hasPhone') && !value.includes('noPhone')) {
          return Boolean(hasPhone)
        }
        if (value.includes('noPhone') && !value.includes('hasPhone')) {
          return !hasPhone
        }
        return true
      },
      enableSorting: false,
    },
    {
      accessorKey: 'role',
      header: ({ column }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-purple-600" />
          <DataTableColumnHeader column={column} title={t('users.role')} />
        </div>
      ),
      cell: ({ row }) => <RoleBadge role={row.getValue('role')} />,
      filterFn: (row, id, value: string[]) => {
        if (!value || !value.length) return true
        const role = (row.getValue(id) as string || '').toLowerCase()
        return value.some((v) => v.toLowerCase() === role)
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'actions',
      cell: DataTableRowActions,
    },
  ]
}

