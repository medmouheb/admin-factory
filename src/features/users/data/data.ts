import { Shield, UserCheck, Users, CreditCard, PhoneCall, PhoneOff, MailCheck, MailX } from 'lucide-react'
import { type UserStatus } from './schema'

export const callTypes = new Map<UserStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
  ['invited', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
  [
    'suspended',
    'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10',
  ],
])

export const roles = [
  {
    label: 'Opérateur',
    value: 'operateur',
    icon: CreditCard,
  },
  {
    label: 'Superviseur',
    value: 'superviseur',
    icon: Users,
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: UserCheck,
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: Shield,
  },
] as const

export const phoneFilterOptions = [
  {
    label: 'Avec Téléphone',
    value: 'hasPhone',
    icon: PhoneCall,
  },
  {
    label: 'Sans Téléphone',
    value: 'noPhone',
    icon: PhoneOff,
  },
] as const

export const emailFilterOptions = [
  {
    label: 'Avec Email',
    value: 'hasEmail',
    icon: MailCheck,
  },
  {
    label: 'Sans Email',
    value: 'noEmail',
    icon: MailX,
  },
] as const
