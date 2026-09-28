import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

type MainProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  fluid?: boolean
  ref?: React.Ref<HTMLElement>
}

/**
 * Main content wrapper — transparent background so the
 * global ambient orbs (set on AuthenticatedLayout) show through.
 */
export function Main({ fixed, className, fluid, children, ...props }: MainProps) {
  return (
    <main
      data-layout={fixed ? 'fixed' : 'auto'}
      className={cn(
        'relative min-h-[calc(100vh-4rem)] px-4 py-6 md:p-8',
        // Transparent — lets the global background/orbs show through
        'bg-transparent',
        fixed && 'flex grow flex-col overflow-hidden',
        !fluid &&
          '@7xl/content:mx-auto @7xl/content:w-full @7xl/content:max-w-7xl',
        className
      )}
      {...props}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full"
      >
        {children}
      </motion.div>
    </main>
  )
}
