import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import EmployeeFaqModal from './EmployeeFaqModal'

type EmployeeFaqContextValue = {
  openEmployeeFaq: () => void
}

const EmployeeFaqContext = createContext<EmployeeFaqContextValue | null>(null)

export function EmployeeFaqProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openEmployeeFaq = useCallback(() => setOpen(true), [])

  return (
    <EmployeeFaqContext.Provider value={{ openEmployeeFaq }}>
      {children}
      <EmployeeFaqModal open={open} onClose={() => setOpen(false)} />
    </EmployeeFaqContext.Provider>
  )
}

export function useEmployeeFaq() {
  const ctx = useContext(EmployeeFaqContext)
  if (!ctx) {
    throw new Error('useEmployeeFaq must be used within EmployeeFaqProvider')
  }
  return ctx
}
