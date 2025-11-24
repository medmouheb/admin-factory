import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ErrorPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export function ErrorPopup({ open, onOpenChange, message }: ErrorPopupProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='border-l-8 border-destructive data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2 text-2xl text-destructive'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='h-6 w-6'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' x2='12' y1='8' y2='12' />
              <line x1='12' x2='12.01' y1='16' y2='16' />
            </svg>
            Error Detected
          </AlertDialogTitle>
          <AlertDialogDescription className='text-base font-medium text-foreground'>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => onOpenChange(false)}
            className='bg-destructive text-destructive-foreground transition-transform hover:scale-105 hover:bg-destructive/90 active:scale-95'
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
