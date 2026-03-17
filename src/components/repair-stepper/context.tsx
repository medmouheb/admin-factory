import React, { createContext, useContext, useState } from 'react'
import { CurrentData, CurrentDataContextType } from './types'

const CurrentDataContext = createContext<CurrentDataContextType | null>(null)

export function CurrentDataProvider({ children, initialClient = null }: { children: React.ReactNode, initialClient?: 'lear' | 'serbia' | null }) {
  const [currentData, setCurrentData] = useState<CurrentData>({
    part: { sarbiaPN: '', learPN: '', tescaPN: '', desc: '', qtyPerBox: '' },
    materile: { storageUn: '', availStock: '', barcodes: [] },
    repair: { codePiece: '', checklist: [] },
    ticketCode: null,
    hasCompletedStep1: false,
    client: initialClient,
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
