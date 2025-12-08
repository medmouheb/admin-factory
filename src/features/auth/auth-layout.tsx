import { Logo } from '@/assets/logo'
import { motion } from 'framer-motion'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>

      {/* Floating Gradient Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="container relative grid h-svh max-w-none items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto flex w-full flex-col justify-center space-y-6 py-8 sm:w-[480px]"
        >
          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <div className="relative">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border-2 border-border/50 shadow-2xl"
              >
                <Logo className="h-10 w-10" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  TESCA TUNISIE
                </h1>
              </motion.div>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-xl border-2 border-border/50 shadow-2xl p-8"
          >
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60"></div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] animate-[shimmer_3s_infinite]"></div>

            {children}
          </motion.div>

          {/* Footer Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center text-sm text-muted-foreground"
          >
            By continuing, you agree to our{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary transition-colors">
              Privacy Policy
            </a>
            .
          </motion.p>
        </motion.div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-200%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  )
}
