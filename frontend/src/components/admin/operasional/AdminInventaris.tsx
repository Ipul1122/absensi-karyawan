import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'
import {
  Package,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  FileDown,
  Printer,
  // Calendar,
  MapPin,
  User,
  X,
  Camera,
  FileText,
  Save,
  // CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Loader2,
  PlusCircle
} from 'lucide-react'

interface InventoryItem {
  id: number
  nama_barang: string
  tanggal_pembelian: string
  harga: number
  foto: string | null
  lokasi: string
  struk_pembelian: string | null
  pemakai_barang: string | null
  kondisi_barang: 'ori' | 'second'
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

interface Employee {
  id: number
  name: string
  email: string
}

interface AdminInventarisProps {
  token: string
}

export default function AdminInventaris({ token }: AdminInventarisProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [kondisiFilter, setKondisiFilter] = useState<'all' | 'ori' | 'second'>('all')

  // Modal States
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Form Fields
  const [namaBarang, setNamaBarang] = useState('')
  const [tanggalPembelian, setTanggalPembelian] = useState('')
  const [harga, setHarga] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [pemakaiBarang, setPemakaiBarang] = useState('')
  const [kondisiBarang, setKondisiBarang] = useState<'ori' | 'second'>('ori')
  
  // File uploads
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [strukFile, setStrukFile] = useState<File | null>(null)
  const [strukFileName, setStrukFileName] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  // File Inputs Refs
  const fotoInputRef = useRef<HTMLInputElement>(null)
  const strukInputRef = useRef<HTMLInputElement>(null)

  const fetchInventories = async () => {
    setLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/admin/inventories', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setItems(response.data.data)
      }
    } catch (err) {
      console.error('Gagal mengambil data inventaris:', err)
      Swal.fire({
        title: 'Gagal Memuat',
        text: 'Tidak dapat terhubung ke server API inventaris.',
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.status === 'success') {
        setEmployees(response.data.data)
      }
    } catch (err) {
      console.error('Gagal memuat data karyawan:', err)
    }
  }

  useEffect(() => {
    fetchInventories()
    fetchEmployees()
  }, [])

  const handleOpenAddModal = () => {
    setIsEditMode(false)
    setSelectedId(null)
    setNamaBarang('')
    setTanggalPembelian(new Date().toISOString().split('T')[0])
    setHarga('')
    setLokasi('')
    setPemakaiBarang('')
    setKondisiBarang('ori')
    setFotoFile(null)
    setFotoPreview(null)
    setStrukFile(null)
    setStrukFileName(null)
    setShowModal(true)
  }

  const handleOpenEditModal = (item: InventoryItem) => {
    setIsEditMode(true)
    setSelectedId(item.id)
    setNamaBarang(item.nama_barang)
    setTanggalPembelian(item.tanggal_pembelian)
    setHarga(Math.round(item.harga).toString())
    setLokasi(item.lokasi)
    setPemakaiBarang(item.pemakai_barang || '')
    setKondisiBarang(item.kondisi_barang)
    setFotoFile(null)
    setFotoPreview(item.foto ? getAssetUrl(item.foto) : null)
    setStrukFile(null)
    setStrukFileName(item.struk_pembelian ? 'Struk Pembelian Terunggah' : null)
    setShowModal(true)
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Foto Terlalu Besar',
        text: 'Ukuran foto maksimal adalah 5MB.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc'
      })
      return
    }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const handleStrukChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'File Terlalu Besar',
        text: 'Ukuran berkas struk maksimal adalah 5MB.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc'
      })
      return
    }
    setStrukFile(file)
    setStrukFileName(file.name)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!namaBarang || !tanggalPembelian || !harga || !lokasi) {
      Swal.fire({
        title: 'Form Belum Lengkap',
        text: 'Nama barang, tanggal pembelian, harga, dan lokasi wajib diisi.',
        icon: 'warning',
        background: '#1e293b',
        color: '#f8fafc'
      })
      return
    }

    setSubmitting(true)

    const formData = new FormData()
    formData.append('nama_barang', namaBarang)
    formData.append('tanggal_pembelian', tanggalPembelian)
    formData.append('harga', harga)
    formData.append('lokasi', lokasi)
    formData.append('pemakai_barang', pemakaiBarang)
    formData.append('kondisi_barang', kondisiBarang)

    if (fotoFile) {
      formData.append('foto', fotoFile)
    }
    if (strukFile) {
      formData.append('struk_pembelian', strukFile)
    }

    try {
      let response
      if (isEditMode && selectedId) {
        // We use POST to update endpoint because PHP cannot read multipart form data natively on PUT
        response = await axios.post(`http://localhost:8000/api/admin/inventories/${selectedId}/update`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        response = await axios.post('http://localhost:8000/api/admin/inventories', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      if (response.data.status === 'success') {
        Swal.fire({
          title: 'Berhasil!',
          text: response.data.message || 'Data inventaris berhasil disimpan.',
          icon: 'success',
          background: '#1e293b',
          color: '#f8fafc',
          timer: 1500,
          showConfirmButton: false
        })
        setShowModal(false)
        fetchInventories()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Gagal menyimpan data inventaris.'
      Swal.fire({
        title: 'Gagal Menyimpan',
        text: msg,
        icon: 'error',
        background: '#1e293b',
        color: '#f8fafc'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = (id: number, name: string) => {
    Swal.fire({
      title: 'Hapus Barang Inventaris?',
      text: `Apakah Anda yakin ingin menghapus "${name}"? Berkas gambar dan data akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#475569',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#f8fafc'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8000/api/admin/inventories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.data.status === 'success') {
            Swal.fire({
              title: 'Dihapus!',
              text: 'Barang inventaris telah dihapus dari sistem.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              background: '#1e293b',
              color: '#f8fafc'
            })
            fetchInventories()
          }
        } catch (err: any) {
          console.error(err)
          Swal.fire({
            title: 'Gagal Menghapus',
            text: 'Terjadi kesalahan saat mencoba menghapus barang ini.',
            icon: 'error',
            background: '#1e293b',
            color: '#f8fafc'
          })
        }
      }
    })
  }

  const viewImageModal = (imageUrl: string, title: string) => {
    Swal.fire({
      title: title,
      imageUrl: getAssetUrl(imageUrl),
      imageAlt: title,
      confirmButtonColor: '#ea580c',
      confirmButtonText: 'Tutup',
      background: '#1e293b',
      color: '#f8fafc'
    })
  }

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num)
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Filter & Search Logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pemakai_barang || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesKondisi = kondisiFilter === 'all' || item.kondisi_barang === kondisiFilter

    return matchesSearch && matchesKondisi
  })

  // Statistics calculation
  const totalAssetValue = items.reduce((acc, curr) => acc + Number(curr.harga), 0)
  const totalOri = items.filter((item) => item.kondisi_barang === 'ori').length
  const totalSecond = items.filter((item) => item.kondisi_barang === 'second').length

  // Print PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const kondisiLabel = kondisiFilter === 'all' ? 'Semua Kondisi' : kondisiFilter === 'ori' ? 'Kondisi Original (Ori)' : 'Kondisi Bekas (Second)'

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Inventaris Barang Kantor</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 25px; line-height: 1.5; }
            h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 22px; font-weight: 800; }
            h3 { text-align: center; color: #64748b; font-weight: 600; font-size: 13px; margin-top: 0; margin-bottom: 25px; }
            .meta { margin-bottom: 25px; font-size: 11px; padding: 15px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta table { width: 100%; border-collapse: collapse; }
            .meta td { padding: 4px 8px; border: none; }
            .meta td.label { font-weight: bold; color: #475569; width: 18%; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            table.data-table th { background-color: #f1f5f9; font-weight: 700; color: #334155; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700; border: 1px solid transparent; text-transform: uppercase; }
            .badge-ori { background-color: #ecfdf5; color: #047857; border-color: #a7f3d0; }
            .badge-second { background-color: #fffbeb; color: #b45309; border-color: #fde68a; }
            .summary { margin-top: 25px; text-align: right; font-weight: bold; font-size: 12px; color: #1e293b; }
            @media print {
              button { display: none; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Laporan Inventaris Barang Kantor</h1>
          <h3>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          
          <div class="meta">
            <table>
              <tr>
                <td class="label">Filter Kondisi:</td>
                <td>${kondisiLabel}</td>
                <td class="label">Pencarian Kata Kunci:</td>
                <td>${searchQuery || 'Semua Barang'}</td>
              </tr>
            </table>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th>Nama Barang</th>
                <th>Tanggal Pembelian</th>
                <th>Harga</th>
                <th>Lokasi</th>
                <th>Pemakai Barang</th>
                <th>Kondisi</th>
              </tr>
            </thead>
            <tbody>
              ${filteredItems.length === 0 ? `
                <tr>
                  <td colSpan="7" style="text-align: center; padding: 20px; color: #64748b;">
                    Tidak ada data barang inventaris yang sesuai filter.
                  </td>
                </tr>
              ` : filteredItems.map((item, idx) => `
                <tr>
                  <td style="text-align: center;">${idx + 1}</td>
                  <td><strong>${item.nama_barang}</strong></td>
                  <td>${formatDate(item.tanggal_pembelian)}</td>
                  <td>${formatRupiah(item.harga)}</td>
                  <td>${item.lokasi}</td>
                  <td>${item.pemakai_barang || '-'}</td>
                  <td><span class="badge badge-${item.kondisi_barang}">${item.kondisi_barang}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            Total Nilai Aset: ${formatRupiah(filteredItems.reduce((acc, curr) => acc + Number(curr.harga), 0))}
          </div>

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

  // Export Excel (HTML Table format download as .xls)
  const handleExportExcel = () => {
    let excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:Name>Inventaris Kantor</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ea580c; padding: 8px; text-align: left; }
        th { background-color: #ea580c; color: white; font-weight: bold; }
        .text-center { text-align: center; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 12px; color: #ea580c; margin-bottom: 20px; }
        .footer { font-weight: bold; margin-top: 15px; }
      </style>
      </head>
      <body>
        <div class="title">Laporan Data Inventaris Barang Kantor</div>
        <div class="subtitle">Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID')} | Filter: ${kondisiFilter === 'all' ? 'Semua Kondisi' : kondisiFilter}</div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Barang</th>
              <th>Tanggal Pembelian</th>
              <th>Harga (IDR)</th>
              <th>Lokasi</th>
              <th>Pemakai Barang</th>
              <th>Kondisi</th>
            </tr>
          </thead>
          <tbody>
    `

    filteredItems.forEach((item, idx) => {
      excelContent += `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><b>${item.nama_barang}</b></td>
          <td>${item.tanggal_pembelian}</td>
          <td>${item.harga}</td>
          <td>${item.lokasi}</td>
          <td>${item.pemakai_barang || '-'}</td>
          <td style="text-transform: uppercase;">${item.kondisi_barang}</td>
        </tr>
      `
    })

    if (filteredItems.length === 0) {
      excelContent += `
        <tr>
          <td colspan="7" class="text-center" style="color: #64748b; padding: 20px;">Tidak ada data inventaris.</td>
        </tr>
      `
    }

    excelContent += `
          </tbody>
        </table>
        <div class="footer">Total Nilai Aset: ${totalAssetValue}</div>
      </body>
      </html>
    `

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Inventaris_Kantor_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const isFilterModified = searchQuery !== '' || kondisiFilter !== 'all'

  return (
    <div className="space-y-6 font-quicksand">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Manajemen Inventaris Kantor</h3>
          <p className="text-xs text-slate-500 font-medium">
            Catat dan pantau aset atau barang kantor yang dibeli untuk keperluan operasional perusahaan.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/10 cursor-pointer"
            title="Cetak Laporan PDF"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
            title="Ekspor Excel"
          >
            <FileDown className="w-4 h-4" />
            Ekspor Excel
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-750 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Barang
          </button>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {/* Total Barang */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Total Aset Barang</span>
            <span className="text-3xl font-black text-slate-800 mt-1 block font-mono">{items.length}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Harga Aset */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between sm:col-span-2">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Total Nilai Investasi</span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1.5 block font-mono">
              {formatRupiah(totalAssetValue)}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Kondisi Barang */}
        <div className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Original vs Bekas</span>
            <div className="flex items-center gap-2 mt-2 font-mono text-xs font-bold">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded">
                Ori: {totalOri}
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-250 rounded">
                2nd: {totalSecond}
              </span>
            </div>
          </div>
          <div className="p-3 bg-orange-50 rounded-2xl text-orange-600 border border-orange-100">
            <Tag className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Filter and Search Panel */}
      <section className="bg-white border border-orange-100 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          {/* Search Input */}
          <div className="w-full md:max-w-md space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cari Aset</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang, lokasi, atau pemakai..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 focus:border-red-500 text-slate-800 placeholder-slate-400 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-semibold shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
            {/* Condition Filter */}
            <div className="space-y-1 w-full sm:w-auto">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Kondisi</label>
              <div className="flex bg-orange-50/30 border border-orange-100 rounded-xl p-1 justify-between h-[38px] items-center shadow-sm">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'ori', label: 'Original' },
                  { id: 'second', label: 'Bekas (Second)' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setKondisiFilter(f.id as any)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      kondisiFilter === f.id
                        ? 'bg-white border border-orange-100 text-red-500 shadow-sm font-extrabold'
                        : 'text-slate-500 hover:text-red-500'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filter Button */}
            <div className="w-full sm:w-auto">
              <button
                onClick={() => {
                  setSearchQuery('')
                  setKondisiFilter('all')
                }}
                disabled={!isFilterModified}
                className="w-full sm:w-36 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold rounded-xl text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm hover:shadow h-[38px] flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Table List */}
      <section className="bg-white border border-orange-100 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
              <span className="text-slate-500 font-semibold text-xs">Memuat data barang inventaris...</span>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p>{searchQuery ? 'Barang inventaris tidak ditemukan.' : 'Belum ada barang inventaris terdaftar.'}</p>
          </div>
        ) : (
          <div className="border border-orange-100 rounded-2xl overflow-hidden bg-orange-50/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/30 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider border-b border-orange-100">
                    <th className="py-4 px-5" style={{ width: '80px' }}>Foto</th>
                    <th className="py-4 px-5">Nama Barang</th>
                    <th className="py-4 px-5">Tgl Pembelian</th>
                    <th className="py-4 px-5">Harga</th>
                    <th className="py-4 px-5">Lokasi</th>
                    <th className="py-4 px-5">Pemakai</th>
                    <th className="py-4 px-5">Kondisi</th>
                    <th className="py-4 px-5">Struk</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 text-xs font-semibold text-slate-700">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                      {/* Photo Thumbnail */}
                      <td className="py-4 px-5">
                        {item.foto ? (
                          <img
                            src={getAssetUrl(item.foto)}
                            alt={item.nama_barang}
                            onClick={() => viewImageModal(item.foto!, `Foto Barang: ${item.nama_barang}`)}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-400 flex items-center justify-center border border-orange-100">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {item.nama_barang}
                      </td>

                      {/* Purchase Date */}
                      <td className="py-4 px-5 text-slate-600 font-mono text-[11px]">
                        {formatDate(item.tanggal_pembelian)}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {formatRupiah(item.harga)}
                      </td>

                      {/* Location */}
                      <td className="py-4 px-5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {item.lokasi}
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-4 px-5 text-slate-750">
                        {item.pemakai_barang ? (
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {item.pemakai_barang}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">Bebas / Kantor</span>
                        )}
                      </td>

                      {/* Condition */}
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                            item.kondisi_barang === 'ori'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.kondisi_barang}
                        </span>
                      </td>

                      {/* Struk Bukti */}
                      <td className="py-4 px-5">
                        {item.struk_pembelian ? (
                          <button
                            type="button"
                            onClick={() => {
                              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(item.struk_pembelian || '')
                              if (isImage) {
                                viewImageModal(item.struk_pembelian!, `Struk Pembelian: ${item.nama_barang}`)
                              } else {
                                window.open(getAssetUrl(item.struk_pembelian), '_blank')
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-150 rounded-lg transition-all cursor-pointer text-[10px] font-bold"
                          >
                            <Eye className="w-3 h-3" /> Struk
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic font-medium">Tidak ada</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider w-max ${
                              item.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                                : item.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-250'
                                : 'bg-amber-50 text-amber-700 border-amber-250'
                            }`}
                          >
                            {item.status === 'approved'
                              ? 'Disetujui'
                              : item.status === 'rejected'
                              ? 'Ditolak'
                              : 'Pending'}
                          </span>
                          {item.status === 'rejected' && item.admin_notes && (
                            <p className="text-[10px] text-rose-600 font-semibold italic max-w-[150px] truncate" title={item.admin_notes}>
                              Ket: {item.admin_notes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          {item.status === 'approved' ? (
                            <>
                              <button
                                disabled
                                className="p-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg opacity-60 cursor-not-allowed"
                                title="Barang telah disetujui Direktur (terkunci)"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                disabled
                                className="p-1.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-lg opacity-60 cursor-not-allowed"
                                title="Barang telah disetujui Direktur (terkunci)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 hover:text-indigo-800 rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Edit Barang"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id, item.nama_barang)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-800 rounded-lg transition-all cursor-pointer shadow-sm"
                                title="Hapus Barang"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Modal Form Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl my-8 overflow-hidden animate-zoom-in">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-indigo-400" />
            <div className="p-6">
              {/* Header Modal */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    {isEditMode ? <Edit className="w-4 h-4 text-white" /> : <PlusCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {isEditMode ? 'Edit Barang Inventaris' : 'Tambah Barang Inventaris'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {isEditMode ? 'Perbarui informasi aset kantor' : 'Catat pembelian barang kantor baru'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Photo & Receipt Upload Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-orange-50/20 border border-orange-100 rounded-2xl">
                  {/* Foto Barang */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {fotoPreview ? (
                        <img
                          src={fotoPreview}
                          alt="Pratinjau barang"
                          className="w-16 h-16 rounded-xl object-cover border-2 border-orange-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fotoInputRef.current?.click()}
                        className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-700">Foto Barang</p>
                      <p className="text-[9px] text-slate-400">Maks. 5MB (PNG/JPG)</p>
                      <button
                        type="button"
                        onClick={() => fotoInputRef.current?.click()}
                        className="mt-1 inline-flex items-center px-2 py-1 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                      >
                        {fotoPreview ? 'Ubah Foto' : 'Unggah Foto'}
                      </button>
                      <input
                        ref={fotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFotoChange}
                      />
                    </div>
                  </div>

                  {/* Struk Pembelian */}
                  <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-orange-100 pt-3 sm:pt-0 sm:pl-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="text-[11px] font-bold text-slate-700">Struk Pembelian</p>
                      <p className="text-[9px] text-slate-400 truncate max-w-[150px]">
                        {strukFileName ? strukFileName : 'Maks. 5MB (PDF/JPG)'}
                      </p>
                      <button
                        type="button"
                        onClick={() => strukInputRef.current?.click()}
                        className="mt-1 inline-flex items-center px-2 py-1 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                      >
                        {strukFileName ? 'Ganti File' : 'Unggah File'}
                      </button>
                      <input
                        ref={strukInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={handleStrukChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama Barang */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Nama Barang *
                    </label>
                    <input
                      type="text"
                      required
                      value={namaBarang}
                      onChange={(e) => setNamaBarang(e.target.value)}
                      placeholder="Contoh: MacBook Air M2 2023"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 shadow-sm"
                    />
                  </div>

                  {/* Tanggal Pembelian */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Tanggal Pembelian *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={tanggalPembelian}
                        onChange={(e) => setTanggalPembelian(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Harga Barang */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Harga Barang (Rupiah) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        Rp
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        value={harga}
                        onChange={(e) => setHarga(e.target.value)}
                        placeholder="Harga beli"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-red-400 text-slate-800 rounded-xl py-2 pl-9 pr-3 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Lokasi Barang */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                      Lokasi Barang *
                    </label>
                    <input
                      type="text"
                      required
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      placeholder="Contoh: Ruang Meeting Utama, Meja Kerja A"
                      className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 shadow-sm"
                    />
                  </div>

                  {/* Pemakai Barang */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Pemakai Barang</span>
                      <span className="text-[9px] text-slate-400 normal-case">(Karyawan / Divisi)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        list="karyawan-list"
                        value={pemakaiBarang}
                        onChange={(e) => setPemakaiBarang(e.target.value)}
                        placeholder="Ketik nama karyawan atau divisi"
                        className="w-full bg-slate-50 border border-slate-200 hover:border-orange-200 focus:border-red-400 text-slate-800 placeholder-slate-400 rounded-xl py-2 px-3 outline-none transition-all text-xs font-semibold focus:ring-2 focus:ring-red-100 shadow-sm"
                      />
                      <datalist id="karyawan-list">
                        <option value="Divisi R&D" />
                        <option value="Divisi Marketing" />
                        <option value="Operasional Kantor" />
                        <option value="Ruang HRD" />
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Kondisi Barang */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      Kondisi Barang *
                    </label>
                    <div className="flex gap-4">
                      {[
                        { id: 'ori', label: 'Original / Baru (Ori)' },
                        { id: 'second', label: 'Bekas / Second' }
                      ].map((c) => (
                        <label
                          key={c.id}
                          className={`flex-1 flex items-center justify-center p-3 rounded-2xl border cursor-pointer transition-all gap-2 text-xs font-bold ${
                            kondisiBarang === c.id
                              ? 'bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name="kondisi_barang"
                            value={c.id}
                            checked={kondisiBarang === c.id}
                            onChange={() => setKondisiBarang(c.id as any)}
                            className="sr-only"
                          />
                          <Tag className="w-4 h-4 shrink-0" />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions Button */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-grow flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-750 text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        {isEditMode ? 'Simpan Perubahan' : 'Simpan Barang'}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
