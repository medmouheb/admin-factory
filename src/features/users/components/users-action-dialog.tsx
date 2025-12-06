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

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Operateur', value: 'operateur' },
  { label: 'Manager', value: 'manager' },
  { label: 'Superviseur', value: 'superviseur' },
] as const

const formSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required.'),
    lastName: z.string().min(1, 'Last Name is required.'),
    matricule: z.string().min(1, 'Matricule is required.'),
    phone: z.string().min(1, 'Phone number is required.'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Email is required.' : undefined),
    }),
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
    {
      message: 'Password is required.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 8
    },
    {
      message: 'Password must be at least 8 characters long.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /[a-z]/.test(password)
    },
    {
      message: 'Password must contain at least one lowercase letter.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /\d/.test(password)
    },
    {
      message: 'Password must contain at least one number.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: "Passwords don't match.",
      path: ['confirmPassword'],
    }
  )
type UserForm = z.infer<typeof formSchema>

type UserActionDialogProps = {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const isEdit = !!currentRow
  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
        ...currentRow,
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
      // 50mm x 50mm format
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [50, 50],
      })

      // Helper to generate barcode image
      const getBarcodeImage = (text: string, showText: boolean) => {
        const canvas = document.createElement('canvas')
        JsBarcode(canvas, text, {
          format: 'CODE128',
          displayValue: showText,
          fontSize: 40,
          margin: 0,
        })
        return canvas.toDataURL('image/png')
      }

      // 1. Header: Tesca Tunisia
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      // Center text horizontally: (PageWidth - TextWidth) / 2
      // const pageWidth = 50;
      doc.text('Tesca Tunisia', 25, 6, { align: 'center' })

      // 2. Sub-header: Access Login
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Access Login', 25, 10, { align: 'center' })

      // Divider line
      doc.setLineWidth(0.3)
      doc.line(5, 12, 45, 12)

      // 3. User Name
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const fullName = `${userData.firstName} ${userData.lastName}`
      doc.text(fullName, 25, 17, { align: 'center' })

      // 4. Matricule Section
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Matricule:', 5, 22)
      
      const matriculeImg = getBarcodeImage(userData.matricule, true) // show text below
      // Adjust image placement
      doc.addImage(matriculeImg, 'PNG', 5, 23, 40, 10)

      // 5. Password Section
      // Moved down a bit more to avoid overlap
      doc.text('Password:', 5, 36)

      if (password) {
        const passwordImg = getBarcodeImage(password, false) // hide text below for security/cleanliness look? 
        // Or if user wants to scan it, text might be helpful if scan fails? 
        // User asked to make it beautiful. Standard practice for login cards usually hides cleartext password if it's strictly a barcode login, 
        // but often printed slips show it. The previous code hid it. I'll keep it hidden in barcode but barcode itself encodes it.
        doc.addImage(passwordImg, 'PNG', 5, 37, 40, 8)
      } else {
        doc.setFontSize(8)
        doc.text('(No password)', 5, 39)
      }

      // Add a border around the whole ticket maybe?
      doc.setLineWidth(0.5)
      doc.rect(1, 1, 48, 48) // Border just inside the 50x50 edge

      // Print
      doc.autoPrint()
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)
      iframe.onload = () => {
        iframe.contentWindow?.print()
      }
      
      toast.success('Printing ticket...')
    } catch (e) {
      console.error('PDF generation error', e)
      toast.error('Failed to generate ticket')
    }
  }

  const onSubmit = async (values: UserForm) => {
    try {
      setIsLoading(true)
      const payload: Record<string, any> = {
        firstName: values.firstName,
        lastName: values.lastName,
        matricule: values.matricule,
        email: values.email,
        phone: values.phone,
        role: values.role,
      }
      if (values.password) payload.password = values.password

      if (isEdit && currentRow?.id) {
        const res = await fetch(`http://localhost:8080/api/users/${currentRow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.message || 'Update failed')
          return
        }
        toast.success('User updated')
        
        if (values.password) {
          generatePDF(values, values.password)
        }
      } else {
        const res = await fetch('http://localhost:8080/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          toast.error(err?.message || 'Sign up failed')
          return
        }
        toast.success('User created')
        
        if (values.password) {
          generatePDF(values, values.password)
        }
      }

      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error('Server error')
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
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader className='text-start border-b pb-4'>
          <DialogTitle className="text-2xl font-semibold">
            {isEdit ? '✏️ Edit User' : '➕ Add New User'}
          </DialogTitle>
          <DialogDescription className="text-base mt-1">
            {isEdit ? 'Update user information and credentials.' : 'Create a new user account with role and permissions.'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[28rem] overflow-y-auto py-2 px-1'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end font-medium'>
                      First Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John'
                        className='col-span-4 transition-all focus:ring-2 focus:ring-primary/20'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end font-medium'>
                      Last Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Doe'
                        className='col-span-4 transition-all focus:ring-2 focus:ring-primary/20'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='matricule'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end font-medium'>
                      Matricule
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='EMP001'
                        className='col-span-4 transition-all focus:ring-2 focus:ring-primary/20'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end font-medium'>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john.doe@example.com'
                        className='col-span-4 transition-all focus:ring-2 focus:ring-primary/20'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end font-medium'>
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+1 234 567 890'
                        className='col-span-4 transition-all focus:ring-2 focus:ring-primary/20'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end font-medium'>Role</FormLabel>
                    <div className='col-span-4'>
                      <select
                        className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        value={field.value}
                        onChange={field.onChange}
                      >
                        {roleOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  🔐 Security Credentials
                </p>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end font-medium'>
                          Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder='e.g., S3cur3P@ssw0rd'
                            className='col-span-4 transition-all focus:ring-2 focus:ring-primary/20'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-end font-medium'>
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <PasswordInput
                            disabled={!isPasswordTouched}
                            placeholder='Re-enter password'
                            className='col-span-4 transition-all focus:ring-2 focus:ring-primary/20'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </div>
        <DialogFooter className="border-t pt-4">
          <Button 
            type='submit' 
            form='user-form' 
            disabled={isLoading}
            className="min-w-[120px] transition-all hover:shadow-md"
          >
            {isLoading ? (
              <>
                <span className="mr-2 inline-block animate-spin">⏳</span>
                Saving...
              </>
            ) : (
              <>
                💾 Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
