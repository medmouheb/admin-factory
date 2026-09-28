import { Toaster as Sonner, ToasterProps } from 'sonner'
import { useTheme } from '@/context/theme-provider'

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group [&_div[data-content]]:w-full"
      position="bottom-right"
      richColors
      closeButton
      style={
        {
          /* Glass dark popup */
          '--normal-bg':     'rgba(20, 16, 54, 0.92)',
          '--normal-text':   'rgba(240, 238, 255, 0.95)',
          '--normal-border': 'rgba(139, 92, 246, 0.35)',
          '--success-bg':    'rgba(6, 28, 20, 0.92)',
          '--success-border':'rgba(16, 185, 129, 0.45)',
          '--success-text':  'rgba(52, 211, 153, 0.95)',
          '--error-bg':      'rgba(30, 8, 12, 0.92)',
          '--error-border':  'rgba(244, 63, 94, 0.45)',
          '--error-text':    'rgba(251, 113, 133, 0.95)',
          '--warning-bg':    'rgba(28, 20, 4, 0.92)',
          '--warning-border':'rgba(245, 158, 11, 0.45)',
          '--warning-text':  'rgba(251, 191, 36, 0.95)',
          '--info-bg':       'rgba(4, 20, 40, 0.92)',
          '--info-border':   'rgba(6, 182, 212, 0.45)',
          '--info-text':     'rgba(34, 211, 238, 0.95)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            'backdrop-blur-2xl border shadow-2xl rounded-2xl px-5 py-4 gap-3 ' +
            'shadow-[0_8px_32px_rgba(99,102,241,0.25)] ' +
            'data-[type=success]:shadow-[0_8px_32px_rgba(16,185,129,0.25)] ' +
            'data-[type=error]:shadow-[0_8px_32px_rgba(244,63,94,0.25)]',
          title:       'font-bold text-base tracking-tight',
          description: 'text-sm opacity-80',
          closeButton: 'opacity-60 hover:opacity-100 transition-opacity',
          icon:        'h-5 w-5 mt-0.5',
        },
      }}
      {...props}
    />
  )
}
