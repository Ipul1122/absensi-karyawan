import { Search, UserPlus, Loader2, Trash2 } from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  created_at: string
}

interface AkunKaryawanProps {
  loading: boolean
  filteredEmployees: Employee[]
  searchQuery: string
  setSearchQuery: (v: string) => void
  handleDeleteEmployee: (id: number, name: string) => void
  setShowModal: (b: boolean) => void
  formatDate: (d: string) => string
}

export default function AkunKaryawan({
  loading,
  filteredEmployees,
  searchQuery,
  setSearchQuery,
  handleDeleteEmployee,
  setShowModal,
  formatDate,
}: AkunKaryawanProps) {
  return (
    <section className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-xl space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-200 font-quicksand">Daftar Akun Karyawan</h3>
          <p className="text-xs text-slate-400 font-quicksand font-medium">Total karyawan yang memiliki hak akses login ke sistem portal.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative max-w-xs w-full sm:w-64">
            <Search className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-550" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-indigo-500 text-white placeholder-slate-555 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs"
            />
          </div>

          {/* Create Account Trigger Button */}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer text-xs shrink-0 font-quicksand"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-800/60 rounded-2xl overflow-hidden bg-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800/80 font-quicksand">
                <th className="py-4 px-6">Nama</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Tanggal Dibuat</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm text-slate-350">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-450 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                      Memuat data karyawan...
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 font-semibold">
                    {searchQuery ? 'Karyawan tidak ditemukan.' : 'Belum ada akun karyawan yang terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase font-quicksand">
                          {emp.name.substring(0, 2)}
                        </div>
                        <span className="font-quicksand">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{emp.email}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">{formatDate(emp.created_at)}</td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        className="p-2 text-slate-550 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer inline-flex items-center"
                        title="Hapus Karyawan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
