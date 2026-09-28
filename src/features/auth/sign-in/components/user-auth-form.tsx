import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn, User as UserIcon, Lock, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const matriculeRegex = /^[a-zA-Z0-9]+$/

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const formSchema = z.object({
    matricule: z
      .string()
      .min(5, t('auth.matriculeMinLength') || 'Le matricule doit contenir au moins 5 caractères')
      .regex(matriculeRegex, t('auth.matriculeNoSpecialChars') || 'Caractères spéciaux non autorisés'),
    password: z
      .string()
      .min(1, t('auth.passwordRequired') || 'Veuillez entrer votre mot de passe')
      .min(7, t('auth.passwordMinLength') || 'Au moins 7 caractères requis'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricule: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          matricule: data.matricule,
          password: data.password,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || t('auth.invalidCredentials') || 'Identifiants invalides')
        setIsLoading(false)
        return
      }

      const userData = await res.json()
      toast.success(t('auth.welcomeBackUser', { matricule: data.matricule }) || `Bienvenue ${data.matricule}`)
      auth.setUser(userData)

      let targetPath = redirectTo || '/'
      if (userData.role === 'operateur') {
        targetPath = '/reapirage'
      }

      navigate({ to: targetPath, replace: true })
    } catch (error) {
      console.error(error)
      toast.error(t('auth.serverError') || 'Erreur du serveur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
        autoComplete="off"
        {...props}
      >
        {/* Matricule Field */}
        <FormField
          control={form.control}
          name="matricule"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-xs font-semibold text-violet-200/90 flex items-center gap-1.5 uppercase tracking-wider">
                <UserIcon className="h-3.5 w-3.5 text-violet-400" />
                <span>{t('auth.matricule') || 'Matricule'}</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('auth.enterMatricule') || 'Entrez votre matricule'}
                  className="h-12 rounded-xl bg-[rgba(12,9,36,0.85)] border border-violet-500/30 text-white placeholder:text-violet-300/40 font-mono tracking-wide focus:border-violet-400 focus:ring-4 focus:ring-violet-500/25 transition-all"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-semibold text-violet-200/90 flex items-center gap-1.5 uppercase tracking-wider">
                  <Lock className="h-3.5 w-3.5 text-violet-400" />
                  <span>{t('auth.password') || 'Mot de passe'}</span>
                </FormLabel>
                <button
                  type="button"
                  onClick={() => {
                    toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 1000)),
                      {
                        loading: t('auth.sendingNotification') || 'Envoi du lien...',
                        success: t('auth.notificationSent', { email: 'abderrahmen.dai.11@gmail.com' }) || 'Notification envoyée',
                        error: t('auth.failedToSendNotification') || 'Échec d’envoi',
                      }
                    )
                  }}
                  className="text-xs font-medium text-violet-300 hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
                >
                  {t('auth.forgotPassword') || 'Mot de passe oublié ?'}
                </button>
              </div>
              <FormControl>
                <PasswordInput
                  placeholder={t('auth.enterPassword') || 'Entrez votre mot de passe'}
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />

        {/* Sign In Button */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
          <Button
            type="submit"
            className="w-full h-12 rounded-xl text-sm font-bold tracking-wide text-white bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 shadow-[0_8px_30px_rgba(139,92,246,0.4)] hover:shadow-[0_12px_40px_rgba(139,92,246,0.6)] transition-all cursor-pointer border border-violet-400/30"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                <span>{t('auth.signingIn') || 'Connexion en cours...'}</span>
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4 text-violet-200" />
                <span>{t('auth.signIn') || 'Se connecter'}</span>
              </>
            )}
          </Button>
        </motion.div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-violet-500/20" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
            <span className="bg-[rgba(16,12,44,0.95)] px-3 text-violet-300/70 font-semibold">
              {t('auth.secureLogin') || 'Connexion Sécurisée'}
            </span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300/80">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <span>{t('auth.connectionSecure') || 'Votre connexion est sécurisée et cryptée'}</span>
        </div>
      </form>
    </Form>
  )
}
