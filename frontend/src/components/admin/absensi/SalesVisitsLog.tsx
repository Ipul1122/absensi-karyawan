import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Search, Calendar, RefreshCw, MapPin, Image, FileDown, Compass, SlidersHorizontal } from 'lucide-react'

interface User {
  id: number
  name: string
  email: string
  photo?: string | null
}

interface Visit {
  id: number
  user_id: number
  date: string
  visit_time: string
  client_name: string
  latitude: string
  longitude: string
  photo_path: string
  notes?: string | null
  visit_type?: string | null
  created_at: string
  user: User
}

interface SalesVisitsLogProps {
  token: string
  formatDate: (d: string) => string
  officeLatitude?: string
  officeLongitude?: string
  visitType?: 'sales' | 'client'
}

export default function SalesVisitsLog({ 
  token, 
  formatDate,
  officeLatitude = '-6.2088',
  officeLongitude = '106.8456',
  visitType = 'sales'
}: SalesVisitsLogProps) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15) // Default to 15 (> 10)
  
  // Mobile Filters Collapsible State
  const [showFilters, setShowFilters] = useState(false)
  
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<number, string>>({})

  const fetchVisits = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/sales-visits', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setVisits(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data kunjungan sales:', err)
      Swal.fire({
        title: 'Gagal',
        text: 'Tidak dapat mengambil log kunjungan sales.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc',
        confirmButtonColor: '#ef4444'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVisits()
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterDate, itemsPerPage])

  const isClient = visitType === 'client'
  const titleText = isClient ? 'Kunjungan Klien' : 'Kunjungan Lapangan / Sales'
  const subtitleText = isClient 
    ? 'Monitoring rute kunjungan klien secara realtime.' 
    : 'Monitoring rute kunjungan klien dan laporan lapangan secara realtime.'
  const userCountLabel = isClient ? 'Karyawan Aktif' : 'Sales Aktif'
  const exportFilename = isClient ? 'Rekap_Kunjungan_Klien' : 'Rekap_Kunjungan_Sales'

  const filteredVisits = visits.filter(visit => {
    const matchesType = (visit.visit_type || 'sales') === visitType

    const matchesSearch = 
      !search ||
      visit.user.name.toLowerCase().includes(search.toLowerCase()) ||
      visit.user.email.toLowerCase().includes(search.toLowerCase()) ||
      visit.client_name.toLowerCase().includes(search.toLowerCase())

    const matchesDate = !filterDate || visit.date === filterDate

    return matchesType && matchesSearch && matchesDate
  })

  // Count active filters
  const activeFilterCount = (search ? 1 : 0) + (filterDate ? 1 : 0)

  // Pagination Logic
  const totalItems = filteredVisits.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedVisits = filteredVisits.slice(startIndex, startIndex + itemsPerPage)

  // Address Resolver Function (Nominatim Reverse Geocoding)
  const resolveAddress = async (id: number, lat: string, lng: string) => {
    if (resolvedAddresses[id]) return
    
    // Check presets first
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    if (Math.abs(latitude - (-6.1942189)) < 0.0001 && Math.abs(longitude - 106.815998) < 0.0001) {
      setResolvedAddresses(prev => ({ ...prev, [id]: 'Mall Thamrin City' }))
      return
    }
    const officeLat = parseFloat(officeLatitude)
    const officeLng = parseFloat(officeLongitude)
    if (!isNaN(officeLat) && !isNaN(officeLng)) {
      if (Math.abs(latitude - officeLat) < 0.0005 && Math.abs(longitude - officeLng) < 0.0005) {
        setResolvedAddresses(prev => ({ ...prev, [id]: 'Kantor Pusat' }))
        return
      }
    }

    // Call Nominatim API for reverse geocoding
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
        { headers: { 'Accept-Language': 'id-ID' } }
      )
      if (response.data && response.data.display_name) {
        const addressObj = response.data.address;
        const street = addressObj.road || addressObj.suburb || addressObj.village || '';
        const city = addressObj.city || addressObj.town || addressObj.municipality || addressObj.county || '';
        const displayName = street && city ? `${street}, ${city}` : response.data.display_name.split(',').slice(0, 3).join(',');
        setResolvedAddresses(prev => ({ ...prev, [id]: displayName }))
      } else {
        setResolvedAddresses(prev => ({ ...prev, [id]: `Luar Kantor` }))
      }
    } catch (err) {
      setResolvedAddresses(prev => ({ ...prev, [id]: `Luar Kantor` }))
    }
  }

  // Fetch addresses only for paginated visible visits to optimize API limits
  useEffect(() => {
    paginatedVisits.forEach(visit => {
      resolveAddress(visit.id, visit.latitude, visit.longitude)
    })
  }, [paginatedVisits])

  const showPhoto = (visit: Visit) => {
    Swal.fire({
      title: visit.client_name,
      text: `Dilaporkan oleh: ${visit.user.name} pada ${formatDate(visit.date)} pukul ${visit.visit_time.substring(0, 5)}`,
      imageUrl: `http://localhost:8000${visit.photo_path}`,
      imageAlt: 'Bukti Kunjungan',
      background: '#1e293b',
      color: '#f8fafc',
      showConfirmButton: true,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#6366f1'
    })
  }

  // Export to PDF (Rekapan Absensi Kunjungan)
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Rekap Laporan ${titleText}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 20px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-size: 11px; margin-top: 0; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; }
            @media print {
              button { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Rekap Laporan ${titleText}</h1>
          <h3>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th>Karyawan</th>
                <th>Tanggal & Waktu</th>
                <th>Nama Klien / Tujuan</th>
                <th>Lokasi Kunjungan</th>
                <th>Catatan Lapangan</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVisits.length === 0 ? `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data kunjungan sales yang tersedia.
                  </td>
                </tr>
              ` : filteredVisits.map((visit, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${visit.user.name}</strong><br/><span style="color: #64748b; font-size: 8.5px;">${visit.user.email}</span></td>
                  <td>${formatDate(visit.date)} - ${visit.visit_time.substring(0, 5)} WIB</td>
                  <td><strong>${visit.client_name}</strong></td>
                  <td>${resolvedAddresses[visit.id] || 'Luar Kantor'}</td>
                  <td>${visit.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  // Export to Excel (Rekapan Absensi Kunjungan)
  const handleExportExcel = () => {
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          th, td { border: 1px solid #fed7aa; padding: 8px; text-align: left; }
          th { background-color: #ea580c; color: white; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>Rekap ${titleText}</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Karyawan</th>
              <th>Email</th>
              <th>Tanggal Kunjungan</th>
              <th>Jam Kunjungan</th>
              <th>Nama Klien / Tujuan</th>
              <th>Lokasi Kunjungan</th>
              <th>Catatan Lapangan</th>
            </tr>
          </thead>
          <tbody>
    `

    filteredVisits.forEach((visit, idx) => {
      excelContent += `
        <tr>
          <td>${idx + 1}</td>
          <td><b>${visit.user.name}</b></td>
          <td>${visit.user.email}</td>
          <td>${formatDate(visit.date)}</td>
          <td>${visit.visit_time.substring(0, 5)}</td>
          <td>${visit.client_name}</td>
          <td>${resolvedAddresses[visit.id] || 'Luar Kantor'}</td>
          <td>${visit.notes || '-'}</td>
        </tr>
      `
    })

    if (filteredVisits.length === 0) {
      excelContent += `
        <tr>
          <td colspan="8" style="text-align: center; padding: 20px;">Tidak ada data kunjungan.</td>
        </tr>
      `
    }

    excelContent += `
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${exportFilename}_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-fade-in font-quicksand">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Log {titleText}</h3>
          <p className="text-xs text-slate-500 font-medium">{subtitleText}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed font-quicksand flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98]"
            title="Ekspor PDF"
          >
            <FileDown className="w-4 h-4" />
            Ekspor PDF
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed font-quicksand flex-1 sm:flex-initial hover:scale-[1.02] active:scale-[0.98]"
            title="Ekspor Excel"
          >
            <FileDown className="w-4 h-4" />
            Ekspor Excel
          </button>

          <button
            onClick={fetchVisits}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:border-orange-500 text-slate-500 hover:text-orange-500 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center shrink-0 disabled:opacity-50 shadow-sm hover:scale-[1.02] active:scale-[0.98] h-[38px] w-[38px]"
            title="Segarkan Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Toggle Filters Button */}
      <div className="block md:hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-orange-100 hover:border-orange-200 text-slate-700 font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm hover:shadow active:scale-[0.98]"
        >
          <SlidersHorizontal className="w-4 h-4 text-orange-500" />
          <span>{showFilters ? 'Sembunyikan Filter & Pencarian' : 'Tampilkan Filter & Pencarian'}</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full font-extrabold shadow-sm animate-pulse">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 bg-orange-50/15 p-5 border border-orange-100/60 rounded-2xl ${
        showFilters ? 'grid' : 'hidden md:grid'
      }`}>
        {/* Search */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cari Kunjungan</label>
          <div className="relative">
            <Search className="absolute inset-y-0 left-0 pl-3 w-4.5 h-4.5 my-auto text-slate-400" />
            <input
              type="text"
              placeholder={isClient ? "Nama karyawan, email, atau klien..." : "Nama sales, email, atau klien..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2.5 pl-9 pr-3 outline-none transition-all text-xs font-semibold shadow-sm"
            />
          </div>
        </div>

        {/* Date Filter */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-red-500" />
            Tanggal Kunjungan
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-white border border-slate-200 focus:border-red-500 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold shadow-sm"
          />
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={() => {
              setSearch('')
              setFilterDate('')
            }}
            disabled={!search && !filterDate}
            className="w-full py-2.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow"
          >
            Bersihkan Filter
          </button>
        </div>
      </div>

      {/* Statistics Recap Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-50/50 border border-orange-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand">Total Kunjungan</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 font-quicksand">{filteredVisits.length}</p>
          </div>
          <div className="p-3 bg-white/80 border border-orange-200/50 rounded-xl text-orange-600 shadow-sm">
            <Compass className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50/50 border border-orange-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand font-semibold">Klien Dikunjungi</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 font-quicksand">
              {new Set(filteredVisits.map(v => v.client_name.toLowerCase().trim())).size}
            </p>
          </div>
          <div className="p-3 bg-white/80 border border-orange-200/50 rounded-xl text-orange-600 shadow-sm">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50/50 border border-orange-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-quicksand font-semibold">{userCountLabel}</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1 font-quicksand">
              {new Set(filteredVisits.map(v => v.user_id)).size}
            </p>
          </div>
          <div className="p-3 bg-white/80 border border-orange-200/50 rounded-xl text-orange-600 shadow-sm">
            <Search className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table Section - Desktop */}
      <div className="hidden md:block border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/30 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-orange-100">
                <th className="py-4 px-6">Karyawan</th>
                <th className="py-4 px-6">Tanggal & Waktu</th>
                <th className="py-4 px-6">Nama Klien / Tujuan</th>
                <th className="py-4 px-6 text-center">Foto Bukti</th>
                <th className="py-4 px-6">Lokasi Kunjungan</th>
                <th className="py-4 px-6">Catatan Lapangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100 text-sm text-slate-600">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                      Memuat data kunjungan...
                    </div>
                  </td>
                </tr>
              ) : paginatedVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                    Tidak ada log kunjungan sales yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedVisits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-orange-50/10 transition-colors">
                    {/* User Info */}
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-extrabold text-slate-800">{visit.user.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{visit.user.email}</p>
                      </div>
                    </td>

                    {/* Date Time */}
                    <td className="py-4 px-6">
                      <p className="font-extrabold text-slate-700 text-xs">{formatDate(visit.date)}</p>
                      <p className="font-mono text-[11px] text-orange-600 font-bold mt-1">
                        {visit.visit_time.substring(0, 5)} WIB
                      </p>
                    </td>

                    {/* Client Name */}
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {visit.client_name}
                    </td>

                    {/* Photo Bukti */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => showPhoto(visit)}
                          className="p-2 bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-600 rounded-xl transition-all cursor-pointer"
                          title="Lihat Foto Bukti"
                        >
                          <Image className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* GPS Location (Resolved Location Name) */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 text-xs leading-tight">
                          {resolvedAddresses[visit.id] ? (
                            resolvedAddresses[visit.id]
                          ) : (
                            <span className="text-slate-400 italic text-[11px] font-medium flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                              Mencari nama lokasi...
                            </span>
                          )}
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${visit.latitude},${visit.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-700 font-semibold"
                          title="Buka di Google Maps"
                        >
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>Buka Peta</span>
                        </a>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-4 px-6">
                      {visit.notes ? (
                        <p className="text-xs text-slate-600 font-medium max-w-xs leading-relaxed truncate hover:text-clip hover:whitespace-normal" title={visit.notes}>
                          {visit.notes}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List Section */}
      <div className="block md:hidden space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400 font-medium bg-white border border-orange-100 rounded-2xl shadow-sm">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
              <span>Memuat data kunjungan...</span>
            </div>
          </div>
        ) : paginatedVisits.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-semibold bg-white border border-orange-100 rounded-2xl shadow-sm">
            Tidak ada log kunjungan sales yang ditemukan.
          </div>
        ) : (
          paginatedVisits.map((visit) => (
            <div key={visit.id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-4 hover:border-orange-200 hover:shadow-md transition-all">
              {/* Card Header: User avatar, name, date & photo */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                    {visit.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-805 text-sm">{visit.user.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{visit.user.email}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 block">
                    {formatDate(visit.date)}
                  </span>
                  <span className="font-mono text-[10px] text-orange-600 font-bold block">
                    {visit.visit_time.substring(0, 5)} WIB
                  </span>
                </div>
              </div>

              {/* Card Body: Client details & Maps */}
              <div className="bg-orange-50/10 p-3 border border-orange-100/50 rounded-xl space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Klien / Tujuan</span>
                  <span className="text-xs font-bold text-slate-800 block">{visit.client_name}</span>
                </div>
                
                <div className="border-t border-orange-100/30 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi Kunjungan</span>
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className="text-xs font-semibold text-slate-700 leading-tight">
                      {resolvedAddresses[visit.id] ? (
                        resolvedAddresses[visit.id]
                      ) : (
                        <span className="text-slate-400 italic text-[11px] font-medium flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
                          Mencari nama lokasi...
                        </span>
                      )}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${visit.latitude},${visit.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] text-blue-500 hover:text-blue-700 font-bold w-fit"
                      title="Buka di Google Maps"
                    >
                      <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                      <span>Buka Peta</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Catatan Lapangan</span>
                {visit.notes ? (
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {visit.notes}
                  </p>
                ) : (
                  <span className="text-xs text-slate-400 italic block">-</span>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-orange-50">
                <button
                  onClick={() => showPhoto(visit)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-orange-50 hover:bg-orange-100 border border-orange-100 text-orange-600 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-[0.98]"
                >
                  <Image className="w-4 h-4 text-orange-500" />
                  <span>Lihat Foto Bukti</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-orange-100">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold">
            <span>
              Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> sampai{' '}
              <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari{' '}
              <span className="font-bold text-slate-700">{totalItems}</span> entri kunjungan
            </span>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="bg-white border border-slate-200 hover:border-orange-500 rounded-lg p-1 outline-none font-bold text-slate-700 transition-all cursor-pointer"
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span>entri</span>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                })
                .map((page, index, array) => {
                  const showEllipsisBefore = page > 1 && array[index - 1] !== page - 1
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && <span className="px-1.5 text-slate-400 text-xs">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-orange-500 border border-orange-500 text-white shadow-sm'
                            : 'border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600 bg-white'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  )
                })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
