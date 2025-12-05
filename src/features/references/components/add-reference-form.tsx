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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, Barcode, Tag, FileText, Plus, Eraser, CheckCircle2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  learPN: z.string().min(1, 'Lear PN is required'),
  tescaPN: z.string().min(1, 'Tesca PN is required'),
  desc: z.string().min(1, 'Description is required'),
})

export function AddReferenceForm() {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      learPN: '',
      tescaPN: '',
      desc: '',
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      await axios.post('http://localhost:8080/api/parts', values)
      toast.success('Reference added successfully', {
        description: `${values.learPN} - ${values.desc}`,
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      })
      form.reset()
    } catch (error) {
      console.error('Error adding reference:', error)
      toast.error('Failed to add reference', {
        description: 'Please check your connection and try again.',
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
    <div className='flex justify-center p-4'>
      <Card className={cn(
        'w-full max-w-3xl border-t-4 border-t-primary shadow-lg',
        'animate-in fade-in slide-in-from-bottom-4 duration-700',
        'hover:shadow-xl transition-all duration-300'
      )}>
        <CardHeader className='space-y-1'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold tracking-tight'>New Reference</CardTitle>
              <CardDescription className='text-muted-foreground mt-2'>
                Add a new part reference to the master database.
              </CardDescription>
            </div>
            <div className='bg-primary/10 rounded-full p-3 transition-transform duration-500 hover:rotate-180'>
              <Plus className='text-primary h-6 w-6' />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className='pt-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='learPN'
                  render={({ field }) => (
                    <FormItem className='animate-in fade-in slide-in-from-left-4 duration-500 delay-100 fill-mode-backwards'>
                      <FormLabel className='flex items-center gap-2'>
                        <Barcode className='h-4 w-4 text-blue-500' />
                        Lear PN
                      </FormLabel>
                      <FormControl>
                        <div className='relative group'>
                          <Input 
                            placeholder='e.g. 350100200' 
                            className='pl-9 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 group-hover:border-blue-400' 
                            {...field} 
                          />
                          <Barcode className='text-muted-foreground absolute left-3 top-2.5 h-4 w-4 transition-colors group-hover:text-blue-500' />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The unique Lear part number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='tescaPN'
                  render={({ field }) => (
                    <FormItem className='animate-in fade-in slide-in-from-right-4 duration-500 delay-200 fill-mode-backwards'>
                      <FormLabel className='flex items-center gap-2'>
                        <Tag className='h-4 w-4 text-green-500' />
                        Tesca PN
                      </FormLabel>
                      <FormControl>
                        <div className='relative group'>
                          <Input 
                            placeholder='e.g. 350100200' 
                            className='pl-9 transition-all duration-200 focus:ring-2 focus:ring-green-500/20 group-hover:border-green-400' 
                            {...field} 
                          />
                          <Tag className='text-muted-foreground absolute left-3 top-2.5 h-4 w-4 transition-colors group-hover:text-green-500' />
                        </div>
                      </FormControl>
                      <FormDescription>
                        The corresponding Tesca part number.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='desc'
                render={({ field }) => (
                  <FormItem className='animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-backwards'>
                    <FormLabel className='flex items-center gap-2'>
                      <FileText className='h-4 w-4 text-orange-500' />
                      Description
                    </FormLabel>
                    <FormControl>
                      <div className='relative group'>
                        <Input 
                          placeholder='e.g. WIRING HARNESS ASSEMBLY' 
                          className='pl-9 transition-all duration-200 focus:ring-2 focus:ring-orange-500/20 group-hover:border-orange-400' 
                          {...field} 
                        />
                        <FileText className='text-muted-foreground absolute left-3 top-2.5 h-4 w-4 transition-colors group-hover:text-orange-500' />
                      </div>
                    </FormControl>
                    <FormDescription>
                      A brief description of the part.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center justify-end gap-4 pt-4 animate-in fade-in duration-700 delay-500'>
                <Button 
                  type='button' 
                  variant='outline' 
                  onClick={handleReset}
                  disabled={loading}
                  className='transition-transform active:scale-95'
                >
                  <Eraser className='mr-2 h-4 w-4' />
                  Reset
                </Button>
                <Button 
                  type='submit' 
                  disabled={loading}
                  className='min-w-[150px] transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg'
                >
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className='mr-2 h-4 w-4' />
                      Add Reference
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='bg-muted/50 flex justify-center py-4 rounded-b-xl'>
          <p className='text-muted-foreground text-sm flex items-center gap-2'>
            <CheckCircle2 className="h-4 w-4" />
            Ensure all part numbers are verified before submission.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
