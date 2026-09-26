import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import StepperFull from '@/components/repair-stepper/index'

export const Route = createFileRoute('/_authenticated/reapirage')({
  component: ReapiragePage,
})

function ReapiragePage() {
  const [selectedClient, setSelectedClient] = useState<'lear' | 'serbia' | null>(null)

  if (selectedClient) {
    return <StepperFull client={selectedClient} />
  }

  return (
    <div className="reapirage-page flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] bg-transparent">
      <div className="reapirage-blob reapirage-blob--a" aria-hidden="true" />
      <div className="reapirage-blob reapirage-blob--b" aria-hidden="true" />
      <div className="reapirage-blob reapirage-blob--c" aria-hidden="true" />
      <div className="reapirage-grain" aria-hidden="true" />
      <div className="reapirage-vignette" aria-hidden="true" />

      <h1 className="text-[2.5rem] font-black text-[#0f172a] tracking-tight mb-2 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
        CHOIX DU CLIENT
      </h1>
      <p className="text-[#475569] font-medium text-[1.1rem] mb-12 drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
        Sélectionnez le client concerné par cette session de scannage.
      </p>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Card Lear */}
        <button
          onClick={() => setSelectedClient('lear')}
          className="flex flex-col items-center justify-center w-[22rem] h-[20rem] bg-white/85 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-[0_24px_55px_rgb(0,0,0,0.10)] transition-all duration-300 group cursor-pointer border border-white/60 hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-[#eff6ff] rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
            <span className="text-4xl text-blue-500">🏢</span>
          </div>
          <span className="text-[2rem] font-black text-[#0f172a] mb-8 tracking-wide">LEAR</span>
          <div className="flex flex-col items-center">
            <div className="w-10 h-1 bg-[#bfdbfe] rounded-full mb-3" />
            <span className="text-[0.75rem] font-black tracking-widest text-[#64748b]">
              SCANNER <span className="text-[#3b82f6]">PN LEAR</span>
            </span>
          </div>
        </button>

        {/* Card Serbia */}
        <button
          onClick={() => setSelectedClient('serbia')}
          className="flex flex-col items-center justify-center w-[22rem] h-[20rem] bg-white/85 backdrop-blur-md rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:shadow-[0_24px_55px_rgb(0,0,0,0.10)] transition-all duration-300 group cursor-pointer border border-white/60 hover:-translate-y-1"
        >
          <div className="w-24 h-24 bg-[#ecfdf5] rounded-full flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
            <span className="text-4xl">🌍</span>
          </div>
          <span className="text-[2rem] font-black text-[#0f172a] mb-8 tracking-wide">SERBIA</span>
          <div className="flex flex-col items-center">
            <div className="w-10 h-1 bg-[#6ee7b7] rounded-full mb-3" />
            <span className="text-[0.75rem] font-black tracking-widest text-[#64748b]">
              SCANNER <span className="text-[#10b981]">KG PN</span>
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}
