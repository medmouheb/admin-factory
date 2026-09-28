import { Shield, Lock, Heart, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useTranslation()

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Dark gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,11,38,0.0) 0%, rgba(13,11,38,0.85) 40%, rgba(10,8,30,0.95) 100%)',
        }}
      />

      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      {/* Ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-16 w-64 pointer-events-none opacity-30"
        style={{
          background:
            'radial-gradient(ellipse, rgba(99,102,241,0.6) 0%, transparent 70%)',
        }}
      />

      <div className="relative px-6 py-5">
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
          {/* Left — Logo + Security badge */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-1 duration-500">
              <img
                src="/images/tesca70x70.png"
                alt="Tesca Logo"
                className="h-9 w-9 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-110 hover:shadow-indigo-500/40 ring-1 ring-white/10"
              />
              <div className="flex flex-col">
                <span className="font-bold text-white/90 text-sm">{t('footer.company')}</span>
                <span className="text-[10px] text-white/40">{t('footer.subtitle')}</span>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 animate-in fade-in slide-in-from-left-2 duration-500">
              <Shield className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-300">
                {t('footer.security')}
              </span>
              <Lock className="h-3 w-3 text-indigo-400" />
            </div>

            {/* System status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">System Online</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Right — Copyright */}
          <div className="flex items-center gap-2 text-xs text-white/35 animate-in fade-in slide-in-from-right-2 duration-500">
            <span>© {currentYear} {t('footer.copyright')}</span>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-1 text-white/35">
              {t('footer.madeWith')}
              <Heart className="h-3 w-3 text-rose-400 fill-rose-400 animate-pulse" />
              {t('footer.by')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
