import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import axios from 'axios'
import { toast } from 'sonner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, FileText, Plus, Eraser, CheckCircle2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  learPN: z.string().min(1, 'Lear PN is required'),
  tescaPN: z.string().min(1, 'Tesca PN is required'),
  desc: z.string().min(1, 'Description is required'),
  qtyPerBox: z.string().min(1, 'quantity is required'),

})


interface ReferenceFormProps {
  initialData?: any
  onSuccess?: () => void
}

export function AddReferenceForm({ initialData, onSuccess }: ReferenceFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!initialData

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      learPN: initialData?.learPN || '',
      tescaPN: initialData?.tescaPN || '',
      desc: initialData?.desc || '',
      qtyPerBox: initialData?.qtyPerBox ? String(initialData.qtyPerBox) : '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      if (isEditing) {
        await axios.put(`http://localhost:8080/api/parts/${initialData.id}`, values, { withCredentials: true })
        toast.success('Reference updated successfully')
      } else {
        await axios.post('http://localhost:8080/api/parts', values, { withCredentials: true })
        toast.success('Reference added successfully')
      }

      form.reset()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      console.error('Error saving reference:', error)
      toast.error(isEditing ? 'Failed to update reference' : 'Failed to add reference', {
        description: error.response?.data?.message || 'Please check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    form.reset()
    toast.info('Form reset')
  }

  return (
    <div className="flex justify-center p-4">
      <Card className={cn(
        "w-full max-w-3xl border-2 shadow-2xl",
        "animate-in fade-in slide-in-from-bottom-4 duration-700",
        "hover:shadow-3xl transition-all duration-300",
        "overflow-hidden"
      )}>
        {/* Gradient Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 p-6">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          <div className="relative flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-white">
                {isEditing ? 'Edit Reference' : 'New Reference'}
              </CardTitle>
              <CardDescription className="text-amber-100 mt-2">
                {isEditing ? 'Update the reference details.' : 'Add a new part reference to the master database.'}
              </CardDescription>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 transition-transform duration-500 hover:rotate-180">
              {isEditing ? <FileText className="text-white h-6 w-6" /> : <Plus className="text-white h-6 w-6" />}
            </div>
          </div>
        </div>

        <CardContent className="pt-6 pb-8 bg-gradient-to-br from-white to-gray-50/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="learPN"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100 fill-mode-backwards">
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-semibold">
                        <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Lear PN
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            placeholder="exemple L002525407NCPAF"
                            className="pl-10 h-11 border-2 transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 group-hover:border-orange-400 bg-white"
                            {...field}
                          />
                          <svg className="text-gray-400 absolute left-3 top-3 h-5 w-5 transition-colors group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600">
                        The unique Lear part number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tescaPN"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-right-4 duration-500 delay-200 fill-mode-backwards">
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-semibold">
                        <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tesca PN
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            placeholder="exemple 350647309"
                            className="pl-10 h-11 border-2 transition-all duration-200 focus:ring-4 focus:ring-amber-500/20 group-hover:border-amber-400 bg-white"
                            {...field}
                          />
                          <svg className="text-gray-400 absolute left-3 top-3 h-5 w-5 transition-colors group-hover:text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600">
                        The corresponding Tesca part number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="desc"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-backwards">
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-semibold">
                        <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Description
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            placeholder="exemple CF CC21_L3_RSB60 X3"
                            className="pl-10 h-11 border-2 transition-all duration-200 focus:ring-4 focus:ring-yellow-500/20 group-hover:border-yellow-400 bg-white"
                            {...field}
                          />
                          <svg className="text-gray-400 absolute left-3 top-3 h-5 w-5 transition-colors group-hover:text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600">
                        A brief description of the part.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="qtyPerBox"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 fill-mode-backwards">
                      <FormLabel className="flex items-center gap-2 text-gray-800 font-semibold">
                        <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Quantity by box
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Input
                            placeholder="exemple 10"
                            type="number"
                            className="pl-10 h-11 border-2 transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 group-hover:border-orange-400 bg-white"
                            {...field}
                          />
                          <svg className="text-gray-400 absolute left-3 top-3 h-5 w-5 transition-colors group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs text-gray-600">
                        The quantity of parts by box
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />

              <div className="flex items-center justify-end gap-4 pt-2 animate-in fade-in duration-700 delay-500">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={loading}
                  className="h-11 border-2 transition-transform active:scale-95 hover:bg-gray-50"
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 min-w-[180px] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                      {isEditing ? 'Update Reference' : 'Add Reference'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="bg-gradient-to-r from-orange-50 to-amber-50 border-t-2 border-orange-200 flex justify-center py-4">
          <p className="text-gray-700 text-sm flex items-center gap-2 font-medium">
            <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ensure all part numbers are verified before submission.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
