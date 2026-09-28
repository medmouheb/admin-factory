import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import StepperFull from '@/components/repair-stepper/index'
import { Main } from '@/components/layout/main'
import { Building2, Globe2, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/reapirage')({
  component: ReapiragePage,
})

function ReapiragePage() {
  const [selectedClient, setSelectedClient] = useState<'lear' | 'serbia' | null>(null)

  if (selectedClient) {
    return <StepperFull client={selectedClient} />
  }

  return (
    <Main className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] py-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-4 mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 dark:bg-orange-500/20 px-4 py-1.5 text-xs font-bold text-orange-700 dark:text-orange-300 border border-orange-500/20 shadow-sm"
        >
          <Sparkles className="h-4 w-4 text-orange-600" />
          <span>Poste Opérateur & Scannage</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight drop-shadow-sm"
        >
          CHOIX DU CLIENT
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-600 dark:text-slate-300 font-medium text-base sm:text-lg max-w-xl"
        >
          Sélectionnez le client concerné pour démarrer votre session de réparation et scannage.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Card Lear */}
        <motion.button
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedClient('lear')}
          className="group relative flex flex-col items-center justify-between p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border-2 border-blue-200/80 dark:border-blue-900/40 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden text-center"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-wide mb-2">
              LEAR
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
              Système de scannage direct PN LEAR
            </p>

            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SCANNER PN LEAR</span>
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md group-hover:translate-x-1 transition-transform">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </motion.button>

        {/* Card Serbia */}
        <motion.button
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedClient('serbia')}
          className="group relative flex flex-col items-center justify-between p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border-2 border-emerald-200/80 dark:border-emerald-900/40 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 backdrop-blur-xl transition-all duration-300 cursor-pointer overflow-hidden text-center"
        >
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />

          <div className="relative z-10 flex flex-col items-center w-full">
            <div className="w-24 h-24 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Globe2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>

            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-wide mb-2">
              SERBIA
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
              Système de scannage direct KG PN SERBIA
            </p>

            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SCANNER KG PN</span>
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md group-hover:translate-x-1 transition-transform">
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </motion.button>
      </div>
    </Main>
  )
}

