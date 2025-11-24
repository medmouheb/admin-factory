import React, { createContext, useContext, useState } from 'react'
import { CurrentData, CurrentDataContextType } from './types'

const CurrentDataContext = createContext<CurrentDataContextType | null>(null)

export function CurrentDataProvider({ children }: { children: React.ReactNode }) {
  const [currentData, setCurrentData] = useState<CurrentData>({
    part: { learPN: '', tescaPN: '', desc: '', qtyPerBox: '' },
    materile: { storageUn: '', availStock: '', barcodes: [] },
    repair: { codePiece: '', checklist: [] },
    ticketCode: null,
    hasCompletedStep1: false,
  })

  return (
    <CurrentDataContext.Provider value={{ currentData, setCurrentData }}>
      {children}
    </CurrentDataContext.Provider>
  )
}

export function useCurrentData() {
  const ctx = useContext(CurrentDataContext)
  if (!ctx)
    throw new Error('useCurrentData must be used inside CurrentDataProvider')
  return ctx
}
