import { X, User, Mail, Lock, Loader2, Edit3, BookUser, Hash, Building2, Phone } from 'lucide-react'

interface EditEmployeeModalProps {
  show: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  name: string
  setName: (v: string) => void
  email: string
  password: string
  setPassword: (v: string) => void
  noRekening: string
  setNoRekening: (v: string) => void
  company: string
  setCompany: (v: string) => void
  whatsapp: string
  setWhatsapp: (v: string) => void
  saturdayOff: boolean
  setSaturdayOff: (v: boolean) => void
  sundayOff: boolean
  setSundayOff: (v: boolean) => void
  submitting: boolean
  onViewBiodata?: () => void
  officeLocation: string
  setOfficeLocation: (v: string) => void
}

export default function EditEmployeeModal({
  show,
  onClose,
  onSubmit,
  name,
  setName,
  email,
  password,
  setPassword,
  noRekening,
  setNoRekening,
  company,
  setCompany,
  whatsapp,
  setWhatsapp,
  saturdayOff,
  setSaturdayOff,
  sundayOff,
  setSundayOff,
  submitting,
  onViewBiodata,
  officeLocation,
  setOfficeLocation,
}: EditEmployeeModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-orange-950/20 backdrop-blur-md animate-fade-in">
      <div className="bg-white border border-orange-100 rounded-3xl p-6 max-w-md w-full relative shadow-xl overflow-hidden animate-zoom-in flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent shrink-0"></div>
        
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 font-quicksand">
            <Edit3 className="w-5 h-5 text-red-500" /> Edit Akun Karyawan
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-all cursor-pointer text-slate-400 hover:text-red-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-grow">
          {/* Scrollable Form Body */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-1.5 py-1 min-h-0">
            {onViewBiodata && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between gap-3 mb-2 font-quicksand shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <BookUser className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">Biodata Lengkap</span>
              </div>
              <button
                type="button"
                onClick={onViewBiodata}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                Lihat Biodata
              </button>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <input
                type="text"
                required
                placeholder="Contoh: Syaiful"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-quicksand">
              Email Karyawan (Tidak dapat diubah)
            </label>
            <div className="relative">
              <Mail className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Password Login Baru
            </label>
            <div className="relative">
              <Lock className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <input
                type="password"
                placeholder="Kosongkan jika tidak ingin diubah"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>



          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Nomor WhatsApp
            </label>
            <div className="relative">
              <Phone className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <input
                type="text"
                placeholder="Contoh: 0812XXXXXXXX"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Perusahaan
            </label>
            <div className="relative">
              <Building2 className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs appearance-none cursor-pointer"
              >
                <option value="">-- Pilih Perusahaan --</option>
                <option value="PT Cakrawala Parama Internasional">PT Cakrawala Parama Internasional</option>
                <option value="PT Yasodana Parvez Internasional">PT Yasodana Parvez Internasional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Lokasi Kantor
            </label>
            <div className="relative">
              <Building2 className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <select
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs appearance-none cursor-pointer"
              >
                <option value="jakarta">Jakarta (Pusat)</option>
                <option value="bogor">Bogor (Cabang)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-quicksand">
              Nomor Rekening Bank
            </label>
            <div className="relative">
              <Hash className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-orange-400/80" />
              <input
                type="text"
                placeholder="Masukkan nomor rekening"
                value={noRekening}
                onChange={(e) => setNoRekening(e.target.value)}
                className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-4 outline-none transition-all text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 mt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saturdayOff}
                onChange={(e) => setSaturdayOff(e.target.checked)}
                className="w-4 h-4 accent-red-500 rounded border-slate-300 text-red-650 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 font-quicksand">
                Libur Hari Sabtu (Jadwal 5 Hari Kerja)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sundayOff}
                onChange={(e) => setSundayOff(e.target.checked)}
                className="w-4 h-4 accent-red-500 rounded border-slate-300 text-red-650 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 font-quicksand">
                Libur Hari Minggu (Jadwal Standar)
              </span>
            </label>
            
            <p className="text-[10px] text-slate-400 mt-1 font-quicksand leading-relaxed">
              * Jika checkbox libur diaktifkan, hari tersebut tidak dihitung sebagai hari kerja wajib (tidak dianggap Alpa).
            </p>
          </div>

          </div> {/* End of Scrollable Form Body */}

          <div className="pt-4 mt-2 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-orange-50/50 border border-orange-100 hover:bg-orange-50 text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold font-quicksand"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed font-quicksand"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
