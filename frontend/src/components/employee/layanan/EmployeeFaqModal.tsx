import { useEffect, useState } from 'react'
import { ChevronDown, HelpCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EMPLOYEE_FAQ_ITEMS } from './employeeFaqData'

interface EmployeeFaqModalProps {
  open: boolean
  onClose: () => void
}

export default function EmployeeFaqModal({ open, onClose }: EmployeeFaqModalProps) {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState<string | null>(EMPLOYEE_FAQ_ITEMS[0]?.id ?? null)

  useEffect(() => {
    if (open) {
      setOpenId(EMPLOYEE_FAQ_ITEMS[0]?.id ?? null)
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
    document.body.style.overflow = ''
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-faq-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] border-none cursor-pointer"
        aria-label="Tutup FAQ"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[92vh] sm:max-h-[88vh] bg-[#F5F6FA] rounded-t-[24px] sm:rounded-[24px] flex flex-col shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center justify-end px-3 pt-3 sm:px-4 sm:pt-4">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-6 no-scrollbar">
          <div
            className="rounded-[20px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 sm:p-6"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#FF5A00] flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 id="employee-faq-title" className="text-lg font-bold text-slate-800">
                  Pusat Bantuan & FAQ
                </h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Panduan singkat penggunaan sistem absensi dan layanan karyawan. Pilih pertanyaan di bawah untuk
                  melihat jawaban.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {EMPLOYEE_FAQ_ITEMS.map((item) => {
              const isOpen = openId === item.id
              return (
                <div
                  key={item.id}
                  className="rounded-[20px] border border-slate-100 bg-white overflow-hidden"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer bg-transparent border-none hover:bg-slate-50/80 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] sm:text-base font-semibold text-slate-800 leading-snug pr-2">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#FF5A00] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 -mt-1">
                      <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {item.answer}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-slate-500 pt-2 pb-2">
            Masih butuh bantuan?{' '}
            <button
              type="button"
              className="font-semibold text-[#FF5A00] hover:underline cursor-pointer bg-transparent border-none p-0"
              onClick={() => {
                onClose()
                navigate('/employee/pengaturan')
              }}
            >
              Hubungi via Profil / HRD
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
