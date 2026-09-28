import { Logo } from '@/assets/logo'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language-switcher'
import { UserAuthForm } from './components/user-auth-form'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Factory,
  Radio,
} from 'lucide-react'

export function SignIn2() {
  const { t } = useTranslation()

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0a0724] via-[#0f0b32] to-[#070518] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* ── Floating Animated Ambient Orbs ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-44 -left-44 h-[650px] w-[650px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(99,102,241,0.1) 45%, transparent 70%)',
          animation: 'orb-pulse 11s ease-in-out infinite',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 -right-52 h-[700px] w-[700px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(217,70,239,0.22) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)',
          animation: 'orb-pulse 15s ease-in-out infinite',
          animationDelay: '2.5s',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-[15%] h-[400px] w-[400px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(6,182,212,0.16) 0%, transparent 65%)',
          animation: 'orb-pulse 13s ease-in-out infinite',
          animationDelay: '1.2s',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/4 left-[10%] h-[350px] w-[350px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          animation: 'orb-pulse 9s ease-in-out infinite',
          animationDelay: '4s',
        }}
      />

      {/* Subtle high-tech grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.9) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* ── Main Container: Split or Centered Card ── */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Sign-In Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="lg:col-span-6 xl:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-[rgba(18,14,50,0.85)] border border-violet-500/35 p-6 sm:p-8 shadow-[0_30px_90px_rgba(0,0,0,0.85),0_0_50px_rgba(139,92,246,0.22)] backdrop-blur-3xl">
            {/* Top iridescent glow line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400" />

            {/* Top ambient shine */}
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 h-36"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(168,85,247,0.3) 0%, transparent 75%)',
              }}
            />

            {/* Header: Logo, Brand & Language */}
            <div className="relative flex items-center justify-between mb-5 pb-4 border-b border-violet-500/20">
              <div className="flex items-center gap-3">
                <div className="relative overflow-hidden flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/25 text-violet-300 border border-violet-500/35 shadow-inner">
                  <Logo className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    <span>Tesca Tunisie</span>
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  </h1>
                  <span className="text-[11px] text-violet-300/60 font-medium">
                    Industrial Management Suite
                  </span>
                </div>
              </div>
              <LanguageSwitcher />
            </div>

            {/* Mobile/Tablet image banner */}
            <div className="relative lg:hidden mb-5 overflow-hidden rounded-2xl border border-violet-500/25 h-28 w-full shadow-lg">
              <img
                src="/images/tesca-brand.png"
                alt="Tesca"
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,14,50,0.9)] via-[rgba(18,14,50,0.3)] to-transparent" />
              <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Système de Traçabilité Usine</span>
              </div>
            </div>

            {/* Welcome Typography */}
            <div className="relative space-y-1 mb-5 text-start">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-white via-violet-100 to-purple-200 bg-clip-text text-transparent">
                  {t('auth.welcomeBack') || 'Bon retour'}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-violet-200/70 font-normal leading-relaxed">
                {t('auth.enterCredentials') ||
                  'Entrez vos identifiants pour accéder à votre espace de travail'}
              </p>
            </div>

            {/* Auth Form */}
            <UserAuthForm />

            {/* Terms and Privacy Policy */}
            <p className="mt-5 text-center text-xs text-slate-400/80 leading-relaxed">
              {t('auth.byClickingSignIn') || 'En vous connectant, vous acceptez nos'}{' '}
              <a
                href="/terms"
                className="text-violet-300 hover:text-white underline underline-offset-4 transition-colors"
              >
                {t('auth.termsOfService') || 'Conditions'}
              </a>{' '}
              {t('common.and') || 'et'}{' '}
              <a
                href="/privacy"
                className="text-violet-300 hover:text-white underline underline-offset-4 transition-colors"
              >
                {t('auth.privacyPolicy') || 'Confidentialité'}
              </a>
              .
            </p>
          </div>
        </motion.div>

        {/* Right Side: Showcase Panel with User's Tesca Automotive Image */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="hidden lg:flex lg:col-span-6 flex-col justify-center pl-2"
        >
          {/* Hero Showcase Glass Card with Integrated Image */}
          <div className="relative overflow-hidden rounded-3xl bg-[rgba(16,12,46,0.7)] border border-violet-500/30 backdrop-blur-2xl shadow-2xl">
            {/* Tesca Automotive Brand Hero Image */}
            <div className="relative h-64 xl:h-72 w-full overflow-hidden group">
              <img
                src="/images/tesca-brand.png"
                alt="Tesca Brand"
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              {/* Dark subtle gradient blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(16,12,46,0.98)] via-[rgba(16,12,46,0.35)] to-transparent" />

              {/* Status pill on image */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-white border border-white/20 shadow-lg">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Tesca Automotive Solutions</span>
              </div>
            </div>

            {/* Content below image */}
            <div className="p-6 sm:p-7 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3.5 py-1 text-xs font-semibold text-violet-300 border border-violet-500/30 mb-3">
                <Factory className="h-3.5 w-3.5 text-violet-400" />
                <span>Système de Scannage & Découpe</span>
              </div>

              <h3 className="text-xl xl:text-2xl font-black text-white tracking-tight leading-snug">
                Plateforme Intelligente de Traçabilité Industrielle
              </h3>

              <p className="mt-2 text-xs xl:text-sm text-violet-200/70 leading-relaxed">
                Supervisez les paquets de découpe, les retouches et les comptes opérateurs en temps réel avec une précision absolue.
              </p>

              {/* Showcase Feature Pills */}
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-violet-500/20 text-slate-200 hover:bg-white/10 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/30 text-violet-300 border border-violet-500/30">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">Scannage & Traçabilité Rapide</div>
                    <div className="text-[11px] text-slate-400">Suivi direct par code-barres et matricule</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-violet-500/20 text-slate-200 hover:bg-white/10 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/30 text-blue-300 border border-blue-500/30">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">Gestion des Retouches & Transferts</div>
                    <div className="text-[11px] text-slate-400">Synchronisation usine instantanée</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-violet-500/20 text-slate-200 hover:bg-white/10 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white">Sécurité & Contrôle d'Accès</div>
                    <div className="text-[11px] text-slate-400">Rôles opérateurs, superviseurs et administrateurs</div>
                  </div>
                </div>
              </div>

              {/* Bottom active status */}
              <div className="mt-5 pt-4 border-t border-violet-500/20 flex items-center justify-between text-xs text-violet-300/80">
                <span className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  Serveur Usine Connecté
                </span>
                <span className="font-mono text-slate-400">v2.4 Production</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
