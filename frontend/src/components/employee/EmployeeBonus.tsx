import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { 
  Coins, 
  AlertCircle, 
  CalendarDays, 
  Search,
  Gift,
  ArrowUpDown
} from 'lucide-react'

interface Bonus {
  id: number
  user_id: number
  bonus_amount: number
  bonus_date: string
  description: string | null
  created_at: string
}

interface EmployeeBonusProps {
  token: string
}

export default function EmployeeBonus({ token }: EmployeeBonusProps) {
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)

  // Search & sorting state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const fetchBonuses = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/bonuses', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setBonuses(response.data.data)
      }
    } catch (err: any) {
      console.error('Gagal mengambil data bonus:', err)
      Swal.fire({
        title: 'Error',
        text: 'Gagal memuat riwayat bonus Anda.',
        icon: 'error',
        background: '#fffdfb',
        color: '#3c1105'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBonuses()
  }, [])

  // Calculations
  const totalBonusEarned = bonuses.reduce((acc, curr) => acc + curr.bonus_amount, 0)
  const totalReceivedCount = bonuses.length

  // Filters & sorting
  const filteredBonuses = bonuses
    .filter((item) => {
      const matchesSearch = 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.bonus_date.includes(searchQuery)
      return matchesSearch
    })
    .sort((a, b) => {
      const dateA = new Date(a.bonus_date).getTime()
      const dateB = new Date(b.bonus_date).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

  // Pagination
  const totalItems = filteredBonuses.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = filteredBonuses.slice(startIndex, startIndex + itemsPerPage)

  const displayRupiah = (number: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(number)
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 border border-orange-100/80 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-quicksand">
            Bonus & Insentif Saya
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lihat daftar riwayat bonus, penghargaan, dan insentif kerja yang telah diberikan oleh pihak manajemen.
          </p>
        </div>
        <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
          <Gift className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Total Bonus Received */}
        <div className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Total Akumulasi Bonus Diterima</span>
            <span className="text-2xl font-black text-amber-600 mt-1.5 block font-mono">{displayRupiah(totalBonusEarned)}</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
            <Coins className="w-7 h-7" />
          </div>
        </div>

        {/* Total Times Rewarded */}
        <div className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-quicksand">Frekuensi Penerimaan</span>
            <span className="text-3xl font-black text-slate-800 mt-1.5 block font-mono">
              {totalReceivedCount} <span className="text-sm font-bold text-slate-400">kali</span>
            </span>
          </div>
          <div className="p-3 bg-red-50 rounded-2xl text-red-500 border border-red-100">
            <CalendarDays className="w-7 h-7" />
          </div>
        </div>
      </section>

      {/* Table & Filters */}
      <section className="bg-white border border-orange-100/80 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-orange-100 pb-4">
          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari keterangan bonus..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-4 outline-none transition-all text-xs font-semibold shadow-sm font-quicksand"
            />
          </div>

          {/* Sort button */}
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1.5 px-4.5 py-2 bg-slate-50 hover:bg-orange-50/50 border border-slate-200 hover:border-orange-200 text-slate-600 hover:text-red-500 rounded-xl text-xs font-bold transition-all cursor-pointer font-quicksand"
          >
            <ArrowUpDown className="w-4 h-4" />
            Urutkan Tanggal: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
          </button>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-600"></div>
          </div>
        ) : filteredBonuses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium font-quicksand">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3 animate-pulse" />
            <p>Belum ada riwayat penerimaan bonus.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-quicksand">
                <thead>
                  <tr className="border-b border-orange-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-4">No.</th>
                    <th className="pb-3 px-4">Tanggal Diterima</th>
                    <th className="pb-3 px-4">Jumlah Bonus</th>
                    <th className="pb-3 px-4">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-50 text-xs font-semibold text-slate-700">
                  {paginatedItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                      {/* Number */}
                      <td className="py-4 px-4 text-slate-400">
                        {startIndex + index + 1}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                            <CalendarDays className="w-3.5 h-3.5" />
                          </div>
                          <span>{formatDate(item.bonus_date)}</span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 font-extrabold text-emerald-600 font-mono text-sm">
                        {displayRupiah(item.bonus_amount)}
                      </td>

                      {/* Description */}
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {item.description || <span className="text-slate-400 italic">Tidak ada keterangan</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-orange-100 font-quicksand">
                <span className="text-xs text-slate-500 font-semibold">
                  Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> sampai{' '}
                  <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
                  <span className="font-bold text-slate-700">{totalItems}</span> entri bonus
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        currentPage === page
                          ? 'bg-orange-500 border border-orange-500 text-white shadow-sm font-extrabold'
                          : 'border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </section>

    </div>
  )
}
