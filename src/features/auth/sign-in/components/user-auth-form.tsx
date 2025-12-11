import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
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
      .min(5, t('auth.matriculeMinLength'))
      .regex(matriculeRegex, t('auth.matriculeNoSpecialChars')),
    password: z
      .string()
      .min(1, t('auth.passwordRequired'))
      .min(7, t('auth.passwordMinLength')),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      matricule: '',
      password: '',
    },
  })

  // function onSubmit(data: z.infer<typeof formSchema>) {
  //   setIsLoading(true)

  //   toast.promise(sleep(2000), {
  //     loading: 'Signing in...',
  //     success: () => {
  //       setIsLoading(false)

  //       // Mock successful authentication with expiry computed at success time
  //       const mockUser = {
  //         accountNo: 'ACC001',
  //         email: data.email,
  //         role: ['user'],
  //         exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours from now
  //       }

  //       // Set user and access token
  //       auth.setUser(mockUser)
  //       auth.setAccessToken('mock-access-token')

  //       // Redirect to the stored location or default to dashboard
  //       const targetPath = redirectTo || '/'
  //       navigate({ to: targetPath, replace: true })

  //       return `Welcome back, ${data.email}!`
  //     },
  //     error: 'Error',
  //   })
  // }
  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const res = await fetch('http://localhost:8080/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // 🔥 crucial for HttpOnly cookies
        body: JSON.stringify({
          matricule: data.matricule,
          password: data.password,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || t('auth.invalidCredentials'))
        setIsLoading(false)
        return
      }

      // ✅ Successful login
      const userData = await res.json() // optional, backend can return user info
      toast.success(t('auth.welcomeBackUser', { matricule: data.matricule }))
      // Mock successful authentication with expiry computed at success time

      // Set user in auth store if you want client-side access
      auth.setUser(userData)


      // Redirect based on role
      let targetPath = redirectTo || '/'

      // If user is operateur, redirect to help-center (Tickets Done)
      if (userData.role === 'operateur') {
        targetPath = '/help-center'
      }

      navigate({ to: targetPath, replace: true })
    } catch (error) {
      console.error(error)
      toast.error(t('auth.serverError'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-5', className)}
        {...props}
      >
        {/* Welcome Text */}
        <div className="space-y-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t('auth.welcomeBack')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('auth.enterCredentials')}
          </p>
        </div>

        {/* Matricule Field */}
        <FormField
          control={form.control}
          name="matricule"
          render={({ field }) => (
            <FormItem className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
              <FormLabel className="text-sm font-semibold flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t('auth.matricule')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('auth.enterMatricule')}
                  className="h-11 border-2 focus:ring-4 focus:ring-primary/20 transition-all bg-background/50"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-semibold flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('auth.password')}
                </FormLabel>
                <button
                  type="button"
                  onClick={() => {
                    toast.promise(
                      new Promise((resolve) => setTimeout(resolve, 1000)),
                      {
                        loading: t('auth.sendingNotification'),
                        success: t('auth.notificationSent', { email: 'abderrahmen.dai.11@gmail.com' }),
                        error: t('auth.failedToSendNotification'),
                      }
                    )
                  }}
                  className="text-xs font-medium text-primary hover:underline underline-offset-4 transition-all hover:text-primary/80"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <FormControl>
                <PasswordInput
                  placeholder={t('auth.enterPassword')}
                  className="h-11 border-2 focus:ring-4 focus:ring-primary/20 transition-all bg-background/50"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Sign In Button */}
        <Button
          className="mt-2 h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.signingIn')}
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" />
              {t('auth.signIn')}
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative my-2 animate-in fade-in duration-500 delay-400">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.secureLogin')}
            </span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-in fade-in duration-500 delay-500">
          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>{t('auth.connectionSecure')}</span>
        </div>
      </form>
    </Form>
  )
}
