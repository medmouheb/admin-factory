import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { sleep, cn } from '@/lib/utils'
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

const usernameRegex = /^[a-zA-Z0-9]+$/

const formSchema = z.object({
  username: z
    .string()
    .min(5, 'Username must be at least 5 characters long')
    .regex(usernameRegex, 'Username cannot contain special characters'),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(7, 'Password must be at least 7 characters long'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
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
          username: data.username,
          password: data.password,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || 'Invalid credentials')
        setIsLoading(false)
        return
      }

      // ✅ Successful login
      const userData = await res.json() // optional, backend can return user info
      toast.success(`Welcome back, ${data.username}!`)

      // Set user in auth store if you want client-side access
      auth.setUser(userData)

      // Redirect
      // const targetPath = redirectTo || '/'
      // navigate({ to: targetPath, replace: true })
    } catch (error) {
      console.error(error)
      toast.error('Server error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder='username' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Sign in
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
        </div>

        {/*
        <div className='grid grid-cols-2 gap-2'>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>
        */}
      </form>
    </Form>
  )
}
