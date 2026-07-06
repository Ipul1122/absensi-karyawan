import { useEffect, useState } from 'react'
import { apiClient } from '../../../utils/api'
import Swal from 'sweetalert2'
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface RecycleBinItem {
  id: number
  model_type: string
  model_id: number
  display_name: string
  deleted_at: string
  module_name: string
  created_at: string
  updated_at: string
}

interface PaginationData {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export default function RecycleBin() {
  const [items, setItems] = useState<RecycleBinItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [date, setDate] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  
  // Track action loadings
  const [actionId, setActionId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<'restore' | 'delete' | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get('/admin/recycle-bin', {
        params: {
          page,
          limit,
          date: date || undefined,
          month: month || undefined,
          year: year || undefined
        }
      })
      if (response.data?.status === 'success') {
        setItems(response.data.data.data)
        // Extract pagination details
        const { current_page, last_page, per_page, total, from, to } = response.data.data
        setPagination({ current_page, last_page, per_page, total, from, to })
      }
    } catch (error: any) {
      console.error('Failed to fetch recycle bin items', error)
      Swal.fire({
        title: 'Gagal Memuat Data',
        text: error?.response?.data?.message || 'Terjadi kesalahan saat memuat data tempat sampah.',
        icon: 'error',
        confirmButtonColor: '#ea580c'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [page, limit, date, month, year])

  const handleRestore = (id: number, displayName: string) => {
    Swal.fire({
      title: 'Pulihkan Data?',
      text: `Apakah Anda yakin ingin memulihkan "${displayName}" kembali ke sistem?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Pulihkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669', // emerald
      cancelButtonColor: '#64748b',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionId(id)
        setActionType('restore')
        try {
          const res = await apiClient.post(`/admin/recycle-bin/${id}/restore`)
          if (res.data?.status === 'success') {
            Swal.fire({
              title: 'Berhasil!',
              text: 'Data berhasil dikembalikan ke modul asalnya.',
              icon: 'success',
              confirmButtonColor: '#059669'
            })
            fetchItems()
          }
        } catch (error: any) {
          Swal.fire({
            title: 'Gagal Memulihkan',
            text: error?.response?.data?.message || 'Terjadi kesalahan sistem.',
            icon: 'error',
            confirmButtonColor: '#ea580c'
          })
        } finally {
          setActionId(null)
          setActionType(null)
        }
      }
    })
  }

  const handleDeletePermanent = (id: number, displayName: string) => {
    Swal.fire({
      title: 'Hapus Secara Permanen?',
      text: `Tindakan ini bersifat destruktif. "${displayName}" akan dihapus dari basis data beserta seluruh file/relasi terkait dan TIDAK DAPAT dibatalkan!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus Permanen',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626', // red
      cancelButtonColor: '#64748b',
      background: '#fffdfb',
      color: '#3c1105'
    }).then(async (result) => {
      if (result.isConfirmed) {
        setActionId(id)
        setActionType('delete')
        try {
          const res = await apiClient.delete(`/admin/recycle-bin/${id}`)
          if (res.data?.status === 'success') {
            Swal.fire({
              title: 'Dihapus!',
              text: 'Data telah dihapus secara fisik dan permanen.',
              icon: 'success',
              confirmButtonColor: '#dc2626'
            })
            fetchItems()
          }
        } catch (error: any) {
          Swal.fire({
            title: 'Gagal Menghapus',
            text: error?.response?.data?.message || 'Terjadi kesalahan sistem.',
            icon: 'error',
            confirmButtonColor: '#ea580c'
          })
        } finally {
          setActionId(null)
          setActionType(null)
        }
      }
    })
  }

  const handleResetFilters = () => {
    setDate('')
    setMonth('')
    setYear('')
    setPage(1)
  }

  // Calculate days remaining out of 30 days
  const getRemainingDays = (deletedAtStr: string) => {
    const deletedAt = new Date(deletedAtStr)
    const now = new Date()
    const diffTime = now.getTime() - deletedAt.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    const remaining = 30 - diffDays
    return remaining > 0 ? remaining : 0
  }

  // Format Deleted At Timestamp to Indonesian Friendly format
  const formatDateTime = (dateTimeStr: string) => {
    const d = new Date(dateTimeStr)
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB'
  }

  return (
    <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in font-quicksand">
      
      {/* Header Info */}
      <div className="border-b border-orange-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-md shadow-red-200">
            <Trash2 className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 font-quicksand">Tempat Sampah (Recycle Bin)</h2>
            <p className="text-[11px] text-slate-500">Koreksi dan pulihkan data administrasi yang tidak sengaja terhapus dalam waktu 30 hari.</p>
          </div>
        </div>
        <button
          onClick={fetchItems}
          disabled={loading}
          className="self-start sm:self-auto py-1.5 px-3 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-55"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Segarkan
        </button>
      </div>

      {/* Info Warning Alert */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-800">Kebijakan Penyimpanan Tempat Sampah</h4>
          <p className="text-[10.5px] text-amber-700 font-semibold mt-0.5 leading-relaxed">
            Seluruh item di bawah ini telah dihapus secara lunak (soft delete) untuk mengamankan relasi data. Jika tidak dipulihkan (Restore), sistem secara otomatis menghapusnya secara permanen setelah 30 hari terhitung sejak tanggal penghapusan.
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-end bg-orange-50/10 p-5 border border-orange-100/50 rounded-2xl">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tanggal Spesifik</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              if (e.target.value) {
                setMonth('')
                setYear('')
              }
              setPage(1)
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
          />
        </div>

        <div className="w-full sm:w-[160px]">
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Bulan</label>
          <select
            value={month}
            onChange={(e) => {
              setMonth(e.target.value)
              if (e.target.value) setDate('')
              setPage(1)
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-orange-500"
          >
            <option value="">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>
        </div>

        <div className="w-full sm:w-[120px]">
          <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tahun</label>
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value)
              if (e.target.value) setDate('')
              setPage(1)
            }}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-orange-500"
          >
            <option value="">Semua Tahun</option>
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 4 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full sm:w-auto py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 h-[38px] min-w-[100px]"
        >
          Reset Filter
        </button>
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/20 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-50/60">
                <th className="py-4 px-5 w-[60px] text-center">No</th>
                <th className="py-4 px-5 w-[140px]">Bagian / Modul</th>
                <th className="py-4 px-5">Nama Data / Informasi terhapus</th>
                <th className="py-4 px-5 w-[190px]">Tanggal Dihapus</th>
                <th className="py-4 px-5 w-[140px] text-center">Masa Simpan</th>
                <th className="py-4 px-5 w-[160px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-650 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                      <span className="font-bold text-slate-650">Memuat data tempat sampah...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Tidak ditemukan data terhapus di tempat sampah.
                  </td>
                </tr>
              ) : (
                items.map((item, index) => {
                  const remaining = getRemainingDays(item.deleted_at)
                  const number = (pagination ? (pagination.current_page - 1) * pagination.per_page : 0) + index + 1
                  
                  // Countdown badge color styling
                  let badgeClass = ''
                  if (remaining > 20) {
                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  } else if (remaining >= 10) {
                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-100'
                  } else {
                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse'
                  }

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-5 text-center font-bold text-slate-500">
                        {number}
                      </td>
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 bg-orange-100/50 text-orange-800 text-[10px] font-black rounded-lg uppercase">
                          {item.module_name}
                        </span>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {item.display_name}
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-600">
                        {formatDateTime(item.deleted_at)}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                          Tersisa {remaining} Hari
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleRestore(item.id, item.display_name)}
                            disabled={actionId !== null}
                            className="p-1.5 bg-emerald-50 text-emerald-750 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200/50 flex items-center justify-center gap-1 font-bold text-[10px] active:scale-95 disabled:opacity-50"
                            title="Undo (Pulihkan)"
                          >
                            {actionId === item.id && actionType === 'restore' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            Undo
                          </button>
                          <button
                            onClick={() => handleDeletePermanent(item.id, item.display_name)}
                            disabled={actionId !== null}
                            className="p-1.5 bg-rose-50 text-rose-750 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-rose-200/50 flex items-center justify-center gap-1 font-bold text-[10px] active:scale-95 disabled:opacity-50"
                            title="Hapus Permanen"
                          >
                            {actionId === item.id && actionType === 'delete' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination Footer */}
        {pagination && pagination.total > 0 && (
          <div className="bg-slate-50/50 border-t border-slate-100 py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan <strong className="text-slate-700">{pagination.from}</strong> - <strong className="text-slate-700">{pagination.to}</strong> dari <strong className="text-slate-700">{pagination.total}</strong> baris
              </span>
              
              {/* Pagination Limit Selector (> 10 items) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold border-l border-slate-200 pl-3">
                <span>Tampilkan:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="bg-white border border-slate-200 rounded-lg py-0.5 px-1.5 text-xs font-bold text-slate-750 focus:outline-none cursor-pointer"
                >
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

            {/* Page Buttons */}
            {pagination.last_page > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => {
                  // Show current page, previous, next, first, and last pages (standard clean page layout)
                  const isCurrent = p === page
                  const isNear = Math.abs(p - page) <= 1
                  const isBoundary = p === 1 || p === pagination.last_page

                  if (!isNear && !isBoundary) {
                    if (p === 2 || p === pagination.last_page - 1) {
                      return <span key={p} className="px-1 text-slate-400 font-bold">...</span>
                    }
                    return null
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                        isCurrent
                          ? 'bg-gradient-to-r from-red-500 to-orange-600 text-white border-transparent shadow-sm shadow-orange-500/10'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.last_page}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
