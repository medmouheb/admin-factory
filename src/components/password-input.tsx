import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

type PasswordInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  ref?: React.Ref<HTMLInputElement>
}

export function PasswordInput({
  className,
  disabled,
  ref,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <div className={cn('relative w-full rounded-xl', className)}>
      <input
        type={showPassword ? 'text' : 'password'}
        className='placeholder:text-violet-300/40 flex h-12 w-full rounded-xl border border-violet-500/30 bg-[rgba(12,9,36,0.85)] px-4 pe-11 py-2 text-sm text-white shadow-inner transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium focus:border-violet-400 focus:ring-4 focus:ring-violet-500/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
        ref={ref}
        disabled={disabled}
        {...props}
      />
      <Button
        type='button'
        size='icon'
        variant='ghost'
        disabled={disabled}
        className='text-violet-400 hover:text-white hover:bg-white/10 absolute end-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg transition-colors'
        onClick={() => setShowPassword((prev) => !prev)}
      >
        {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
      </Button>
    </div>
  )
}
