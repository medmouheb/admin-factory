'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { type User } from '../data/schema'
import { useState } from 'react'
import { toast } from 'sonner'
import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import { useUsers } from './users-provider'
import {
  UserPlus,
  Pencil,
  User as UserIcon,
  Mail,
  Phone,
  Hash,
  Shield,
  Lock,
  KeyRound,
  Loader2,
  Save,
  BadgeCheck,
} from 'lucide-react'

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Operateur', value: 'operateur' },
  { label: 'Manager', value: 'manager' },
  { label: 'Superviseur', value: 'superviseur' },
] as const

const formSchema = z
  .object({
    firstName: z.string().min(1, 'Le prénom est requis.'),
    lastName: z.string().min(1, 'Le nom est requis.'),
    matricule: z.string().min(1, 'Le matricule est requis.'),
    phone: z.string().optional().or(z.literal('')),
    email: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        "Format d'email invalide."
      ),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.enum(['superadmin', 'admin', 'operateur', 'manager', 'superviseur']),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    { message: 'Le mot de passe est requis.', path: ['password'] }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 8
    },
    {
      message: 'Le mot de passe doit contenir au moins 8 caractères.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /[a-z]/.test(password)
    },
    {
      message: 'Le mot de passe doit contenir au moins une lettre minuscule.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /\d/.test(password)
    },
    {
      message: 'Le mot de passe doit contenir au moins un chiffre.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: 'Les mots de passe ne correspondent pas.',
      path: ['confirmPassword'],
    }
  )

type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

/* ─── Small helper: field row ──────────────────────────────── */
function FieldRow({
  icon: Icon,
  label,
  children,
  iconColor = 'text-indigo-400',
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
  iconColor?: string
}) {
  return (
    <div className="grid grid-cols-6 items-start gap-x-3 gap-y-1">
      <div className="col-span-2 flex items-center justify-end gap-1.5 pt-2.5">
        <Icon className={`h-3.5 w-3.5 ${iconColor} shrink-0`} />
        <span className="text-sm font-medium text-right text-white/70 leading-tight">{label}</span>
      </div>
      <div className="col-span-4">{children}</div>
    </div>
  )
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const { refreshUsers } = useUsers()

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          ...currentRow,
          email: currentRow?.email ?? '',
          phone: currentRow?.phone ?? '',
          role: currentRow.role,
          password: '',
          confirmPassword: '',
          isEdit,
        }
      : {
          firstName: '',
          lastName: '',
          matricule: '',
          email: '',
          role: 'operateur',
          phone: '',
          password: '',
          confirmPassword: '',
          isEdit,
        },
  })

  const [isLoading, setIsLoading] = useState(false)

  const generatePDF = (userData: any, password?: string) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [50, 50] })
      const m = 2, w = 46, h = 46
      doc.setLineWidth(0.2)
      doc.setDrawColor(0)
      doc.rect(m, m, w, h)
      doc.line(m, 9, m + w, 9)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('TESCA', m + 2, 7)
      doc.text('LOGIN', m + w - 2, 7, { align: 'right' })
      const getBarcodeImage = (text: string, showText: boolean) => {
        const canvas = document.createElement('canvas')
        JsBarcode(canvas, text, { format: 'CODE128', displayValue: showText, fontSize: 40, margin: 0 })
        return canvas.toDataURL('image/png')
      }
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${userData.firstName} ${userData.lastName}`, 25, 14, { align: 'center' })
      doc.line(m, 16, m + w, 16)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Matricule:', m + 2, 20)
      doc.addImage(getBarcodeImage(userData.matricule, true), 'PNG', m + 2, 21, w - 4, 8)
      if (password) {
        doc.text('Password:', m + 2, 33)
        doc.addImage(getBarcodeImage(password, false), 'PNG', m + 2, 34, w - 4, 8)
      }
      doc.line(m, 44, m + w, 44)
      doc.setFontSize(7)
      const now = new Date()
      doc.text(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), 25, 48, { align: 'center' })
      doc.autoPrint()
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      iframe.onload = () => iframe.contentWindow?.print()
      toast.success('Impression du ticket...')
    } catch (e) {
      toast.error('Échec de la génération du ticket')
    }
  }

  const onSubmit = async (values: UserForm) => {
    try {
      setIsLoading(true)
      const payload: Record<string, any> = {
        firstName: values.firstName,
        lastName: values.lastName,
        matricule: values.matricule,
        email: values.email || undefined,
        phone: values.phone || undefined,
        role: values.role,
      }
      if (values.password) payload.password = values.password

      if (isEdit && currentRow?.id) {
        const res = await fetch(`/api/users/${currentRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.message || 'Échec de la mise à jour')
          return
        }
        toast.success('Utilisateur mis à jour avec succès !')
        if (values.password) generatePDF(values, values.password)
      } else {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.message || "Échec de l'inscription")
          return
        }
        toast.success('Utilisateur créé avec succès !')
        if (values.password) generatePDF(values, values.password)
      }

      form.reset()
      onOpenChange(false)
      refreshUsers()
    } catch {
      toast.error('Erreur serveur')
    } finally {
      setIsLoading(false)
    }
  }

  const isPasswordTouched = !!form.formState.dirtyFields.password

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent
        className="sm:max-w-xl p-0 overflow-hidden border-0 shadow-none bg-transparent"
      >
        {/* ── Outer glass shell ─────────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(18,14,52,0.97) 0%, rgba(12,10,38,0.99) 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow:
              '0 0 0 1px rgba(139,92,246,0.08), 0 32px 80px rgba(0,0,0,0.7), 0 8px 32px rgba(99,102,241,0.25)',
          }}
        >
          {/* Ambient top glow */}
          <div
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.35) 0%, transparent 70%)',
            }}
          />

          {/* Decorative top line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          {/* ── Header ──────────────────────────────────────── */}
          <DialogHeader className="relative px-7 pt-7 pb-5">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
                }}
              >
                {isEdit ? (
                  <Pencil className="h-5 w-5 text-white" />
                ) : (
                  <UserPlus className="h-5 w-5 text-white" />
                )}
              </div>

              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {isEdit ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
                </DialogTitle>
                <DialogDescription className="text-sm mt-0.5 text-white/45">
                  {isEdit
                    ? 'Mettre à jour les informations et identifiants.'
                    : 'Créer un nouveau compte utilisateur avec rôle et permissions.'}
                </DialogDescription>
              </div>
            </div>

            {/* Divider */}
            <div className="mt-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </DialogHeader>

          {/* ── Form body ────────────────────────────────────── */}
          <div className="relative max-h-[28rem] overflow-y-auto px-7 py-1 scrollbar-thin scrollbar-thumb-violet-500/30 scrollbar-track-transparent">
            <Form {...form}>
              <form
                id="user-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3.5 pb-2"
              >
                {/* — Personal info section — */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 space-y-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="h-3.5 w-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300/80">
                      Informations personnelles
                    </span>
                  </div>

                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={UserIcon} label="Prénom">
                          <FormControl>
                            <Input
                              placeholder="John"
                              autoComplete="off"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={UserIcon} label="Nom" iconColor="text-violet-400">
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              autoComplete="off"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="matricule"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={Hash} label="Matricule" iconColor="text-cyan-400">
                          <FormControl>
                            <Input
                              placeholder="EMP001"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={Mail} label="Email" iconColor="text-sky-400">
                          <FormControl>
                            <Input
                              placeholder="john.doe@example.com"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={Phone} label="Téléphone" iconColor="text-emerald-400">
                          <FormControl>
                            <Input
                              placeholder="+1 234 567 890"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={BadgeCheck} label="Rôle" iconColor="text-amber-400">
                          <select
                            className="flex h-10 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white transition-all
                              focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20
                              disabled:cursor-not-allowed disabled:opacity-50"
                            value={field.value}
                            onChange={field.onChange}
                          >
                            {roleOptions.map((opt) => (
                              <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />
                </div>

                {/* — Security section — */}
                <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.04] p-4 space-y-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-violet-300/80">
                      Identifiants de sécurité
                    </span>
                    {isEdit && (
                      <span className="ml-auto text-[10px] text-white/30 font-mono">
                        Laisser vide pour conserver
                      </span>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={Lock} label="Mot de passe" iconColor="text-violet-400">
                          <FormControl>
                            <PasswordInput
                              placeholder="e.g., S3cur3P@ssw0rd"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 transition-all"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FieldRow icon={KeyRound} label="Confirmer" iconColor="text-fuchsia-400">
                          <FormControl>
                            <PasswordInput
                              disabled={!isPasswordTouched}
                              placeholder="Confirmer le mot de passe"
                              className="h-10 rounded-xl border-white/10 bg-white/[0.05] text-white placeholder:text-white/25 focus:border-violet-500/60 focus:ring-violet-500/20 transition-all disabled:opacity-40"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-xs text-rose-400 mt-0.5" />
                        </FieldRow>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* ── Footer ──────────────────────────────────────── */}
          <DialogFooter className="relative px-7 py-5">
            {/* Divider */}
            <div className="absolute top-0 left-7 right-7 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="flex w-full items-center justify-between">
              {/* Cancel */}
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  form.reset()
                  onOpenChange(false)
                }}
                className="rounded-xl text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all"
              >
                Annuler
              </Button>

              {/* Submit */}
              <Button
                type="submit"
                form="user-form"
                disabled={isLoading}
                className="min-w-[150px] h-11 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: isLoading
                    ? 'rgba(99,102,241,0.4)'
                    : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                  boxShadow: isLoading ? 'none' : '0 4px 24px rgba(99,102,241,0.45)',
                  border: 'none',
                  color: '#fff',
                }}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isEdit ? 'Mettre à jour' : 'Créer le compte'}
                  </span>
                )}
              </Button>
            </div>
          </DialogFooter>

          {/* Decorative bottom corner orbs */}
          <div
            className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
