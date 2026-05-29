import { useState } from 'react'
import { Search, UserPlus, Loader2, Trash2, Eye, EyeOff, Edit } from 'lucide-react'

interface Employee {
  id: number
  name: string
  email: string
  password_plain?: string
  created_at: string
  updated_at: string
}

interface AkunKaryawanProps {
  loading: boolean
  filteredEmployees: Employee[]
  searchQuery: string
  setSearchQuery: (v: string) => void
  handleDeleteEmployee: (id: number, name: string) => void
  onEditClick: (employee: Employee) => void
  setShowModal: (b: boolean) => void
  formatDate: (d: string) => string
}

export default function AkunKaryawan({
  loading,
  filteredEmployees,
  searchQuery,
  setSearchQuery,
  handleDeleteEmployee,
  onEditClick,
  setShowModal,
  formatDate,
}: AkunKaryawanProps) {
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})

  const togglePassword = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <section className="bg-white/80 border border-orange-100 rounded-3xl p-6 shadow-sm backdrop-blur-md space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-quicksand">Daftar Akun Karyawan</h3>
          <p className="text-xs text-slate-500 font-quicksand font-medium">Total karyawan yang memiliki hak akses login ke sistem portal.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative max-w-xs w-full sm:w-64">
            <Search className="absolute inset-y-0 left-0 pl-3 w-4 h-4 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-orange-50/20 border border-orange-100 focus:border-red-500 focus:ring-1 focus:ring-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs"
            />
          </div>

          {/* Create Account Trigger Button */}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer text-xs shrink-0 font-quicksand"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-orange-100 rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/40 text-orange-950/80 text-xs font-bold uppercase tracking-wider border-b border-orange-100 font-quicksand">
                <th className="py-4 px-6">Nama</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Kata Sandi</th>
                <th className="py-4 px-6">Tanggal Dibuat</th>
                <th className="py-4 px-6">Tanggal Update</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                      Memuat data karyawan...
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                    {searchQuery ? 'Karyawan tidak ditemukan.' : 'Belum ada akun karyawan yang terdaftar.'}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center font-bold text-xs uppercase font-quicksand">
                          {emp.name.substring(0, 2)}
                        </div>
                        <span className="font-quicksand">{emp.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{emp.email}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <span className="font-mono text-xs text-slate-700 select-all block truncate">
                          {showPasswords[emp.id] ? emp.password_plain || 'password' : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePassword(emp.id)}
                          className="p-1 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                          title={showPasswords[emp.id] ? "Sembunyikan Sandi" : "Tampilkan Sandi"}
                        >
                          {showPasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">{formatDate(emp.created_at)}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">{formatDate(emp.updated_at)}</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditClick(emp)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                          title="Edit Karyawan"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
