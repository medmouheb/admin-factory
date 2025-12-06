import { Shield, Lock, Heart } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <div className="relative container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between">
          {/* Left side - Logo and Security message */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Tesca Logo */}
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-1 duration-500">
              <img 
                src="/images/tesca70x70.png" 
                alt="Tesca Logo" 
                className="h-10 w-10 rounded-lg shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-md"
              />
              <div className="flex flex-col">
                <span className="font-bold text-foreground">Tesca Tunisia</span>
                <span className="text-xs text-muted-foreground">Industrial Solutions</span>
              </div>
            </div>
            
            {/* Security Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-left-2 duration-500">
              <Shield className="h-4 w-4 text-primary animate-pulse" />
              <span className="font-medium text-foreground text-sm">
                All credentials secured by{' '}
                <span className="font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  DAIScannage
                </span>
              </span>
              <Lock className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>

          {/* Right side - Copyright */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-right-2 duration-500">
            <span>© {currentYear} DAIScannage</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 animate-pulse" /> by Tesca Team
            </span>
          </div>
        </div>

        {/* Bottom decorative line */}
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </footer>
  )
}
