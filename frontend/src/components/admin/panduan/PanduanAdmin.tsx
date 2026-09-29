import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Search,
  ArrowRight,
  Clock,
  Users,
  CheckSquare,
  CalendarDays,
  Coins,
  MapPin,
  ShieldCheck,
  ReceiptText,
  KeyRound,
  Sparkles,
  CheckCircle2,
  Star,
  Lightbulb,
  FileSpreadsheet
} from 'lucide-react'

interface GuideTopic {
  id: string
  title: string
  category: 'absensi' | 'kpi' | 'karyawan' | 'operasional' | 'payroll' | 'pengaturan'
  badge: string
  badgeColor: string
  description: string
  steps: string[]
  tips?: string
  directPath: string
  directLabel: string
  icon: any
}

export default function PanduanAdmin() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'Semua Panduan', icon: BookOpen },
    { id: 'absensi', label: 'Absensi & Monitoring', icon: Clock },
    { id: 'kpi', label: 'To-Do List & KPI Tim', icon: CheckSquare },
    { id: 'karyawan', label: 'Data Karyawan', icon: Users },
    { id: 'operasional', label: 'Operasional & Izin', icon: CalendarDays },
    { id: 'payroll', label: 'Penggajian (Payroll)', icon: Coins },
    { id: 'pengaturan', label: 'Pengaturan Sistem', icon: MapPin },
  ]

  const topics: GuideTopic[] = [
    {
      id: 'dashboard-monitoring',
      title: 'Dashboard Monitoring Kehadiran Real-Time',
      category: 'absensi',
      badge: 'Monitoring',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Pusat pantauan utama untuk melihat statistik kehadiran harian, jumlah karyawan hadir, terlambat, izin, cuti, dan aktivitas presensi langsung hari ini.',
      steps: [
        'Buka menu Dashboard untuk melihat ringkasan statistik terkini hari ini.',
        'Periksa daftar staf yang hadir tepat waktu, datang awal, terlambat, maupun yang sedang izin/cuti.',
        'Klik nama staf pada daftar untuk melihat detail jam masuk dan foto presensinya.'
      ],
      tips: 'Dashboard otomatis memuat data terbaru setiap kali dibuka.',
      directPath: '/admin/dashboard',
      directLabel: 'Buka Dashboard',
      icon: Clock
    },
    {
      id: 'absen-mandiri-admin',
      title: 'Presensi Mandiri Admin / HR',
      category: 'absensi',
      badge: 'Absensi Staf',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Sebagai staf Admin / HR, Anda juga dapat melakukan pencatatan presensi Check-In dan Check-Out mandiri menggunakan kamera selfie dan titik GPS.',
      steps: [
        'Pilih menu Absen di sidebar navigasi.',
        'Izinkan browser mengakses GPS dan Kamera perangkat Anda.',
        'Ambil foto selfie Anda dan klik tombol Check In saat mulai bekerja.',
        'Saat selesai jam kerja, klik tombol Check Out untuk merekam jam pulang.'
      ],
      tips: 'Pastikan sinyal GPS stabil untuk mendeteksi koordinat lokasi yang akurat.',
      directPath: '/admin/absen-mandiri',
      directLabel: 'Buka Absen Mandiri',
      icon: Clock
    },
    {
      id: 'rekap-absensi',
      title: 'Rekapitulasi & Koreksi Absensi Karyawan',
      category: 'absensi',
      badge: 'Rekap & Export',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Melihat riwayat kehadiran seluruh staf, mengecek titik koordinat GPS dan foto selfie, mengoreksi jam presensi jika terjadi kendala, serta mengekspor rekap ke Excel.',
      steps: [
        'Buka menu Data Karyawan → Rekap Absensi.',
        'Gunakan filter tanggal, bulan, atau nama divisi untuk menyaring data kehadiran.',
        'Klik tombol "Detail" pada baris absensi untuk melihat foto Check-In/Out dan peta lokasi.',
        'Gunakan tombol "Edit Jam" jika karyawan mengalami kendala perangkat dan butuh koreksi jam resmi oleh HR.',
        'Klik tombol "Export Excel" untuk mengunduh rekapitulasi kehadiran lengkap dalam format spreadsheet.'
      ],
      tips: 'Koreksi jam oleh Admin akan tercatat dengan label verifikasi khusus pada sistem.',
      directPath: '/admin/rekapAbsensi',
      directLabel: 'Buka Rekap Absensi',
      icon: FileSpreadsheet
    },
    {
      id: 'todo-hr',
      title: 'To-Do List Harian Saya (Staf HR)',
      category: 'kpi',
      badge: 'KPI & Laporan',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      description: 'Mencatat pekerjaan yang dilakukan oleh staf Admin/HR setiap hari. Hasil to-do list akan terkirim langsung ke Direktur Utama untuk dievaluasi dan dinilai.',
      steps: [
        'Buka menu Operasional → To-Do List Saya (HR).',
        'Ketik nama pekerjaan pada kolom input form, lalu pilih status awal (🔴 Proses / 🟡 Revisi / 🟢 Selesai).',
        'Gunakan tombol "+ Buat" untuk menginput beberapa pekerjaan sekaligus secara masal.',
        'Lampirkan foto bukti pekerjaan pada setiap tugas (Maksimal ukuran 2MB per gambar).',
        'Gunakan tombol "Kemarin" untuk menarik otomatis tugas kemarin yang masih berstatus 🔴 Proses atau 🟡 Revisi.',
        'Ubah status tugas secara fleksibel: 🟢 Selesai, 🟡 Revisi, atau 🔴 Proses.',
        'Klik "Kirim ke Direktur" di akhir hari kerja agar pekerjaan Anda dinilai oleh Direktur Utama.'
      ],
      tips: '🟢 Hijau = Selesai, 🟡 Kuning = Revisi, 🔴 Merah = Proses. Maksimal foto lampiran 2MB.',
      directPath: '/admin/todo',
      directLabel: 'Buka To-Do List HR',
      icon: CheckSquare
    },
    {
      id: 'monitoring-kpi-tim',
      title: 'Monitoring & Penilaian KPI Tim Karyawan',
      category: 'kpi',
      badge: 'Evaluasi Tim',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Memantau ketercapaian to-do list seluruh karyawan, melihat bukti foto pekerjaan, memberikan rating bintang (1-5), dan mencatat evaluasi catatan kerja.',
      steps: [
        'Buka menu Operasional → Monitoring KPI Tim.',
        'Lihat ringkasan produktivitas tim: total tugas, persentase tuntas, dan daftar laporan per tanggal.',
        'Klik tombol "Detail" pada karyawan yang ingin Anda tinjau pekerjaannya.',
        'Periksa foto bukti kerja dengan mengklik foto untuk memperbesar (lightbox).',
        'Beri penilaian bintang 1 sampai 5 serta catatan evaluasi masukan untuk karyawan.',
        'Klik tombol "Export Excel" untuk mengunduh rekap kinerja tim.'
      ],
      tips: 'Karyawan dapat melihat catatan dan rating bintang yang Anda berikan pada dashboard mereka.',
      directPath: '/admin/kpi',
      directLabel: 'Buka Monitoring KPI Tim',
      icon: Star
    },
    {
      id: 'kelola-akun-karyawan',
      title: 'Kelola Akun & Data Karyawan',
      category: 'karyawan',
      badge: 'Data Staf',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      description: 'Menambah karyawan baru, mengedit profil, mengatur lokasi penugasan (Jakarta / Bogor), nomor rekening gaji, nomor WhatsApp, serta hari libur khusus karyawan.',
      steps: [
        'Buka menu Data Karyawan → Akun.',
        'Klik tombol "+ Tambah Karyawan" untuk mendaftarkan akun staf baru.',
        'Isi nama, email, password awal, divisi, nomor rekening, dan lokasi kantor (Jakarta/Bogor).',
        'Atur jadwal libur reguler staf (Sabtu libur / Minggu libur).',
        'Klik tombol Edit (Pensil) pada tabel untuk memperbarui data staf atau mereset password akun.',
        'Gunakan tombol Hapus jika staf sudah tidak aktif lagi di perusahaan.'
      ],
      tips: 'Hanya Direktur yang berhak membuat atau mengelola akun Admin/HR baru.',
      directPath: '/admin/akunKaryawan',
      directLabel: 'Buka Akun Karyawan',
      icon: Users
    },
    {
      id: 'approval-cuti',
      title: 'Manajemen & Persetujuan Pengajuan Cuti',
      category: 'operasional',
      badge: 'Persetujuan Cuti',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Meninjau permohonan cuti tahunan, cuti melahirkan, atau cuti khusus dari karyawan, memeriksa sisa kuota cuti, dan memutuskan persetujuan.',
      steps: [
        'Buka menu Operasional → Cuti.',
        'Lihat daftar pengajuan yang berstatus "Menunggu Persetujuan".',
        'Periksa tanggal cuti yang diajukan, alasan, dan sisa jatah kuota cuti staf.',
        'Klik tombol "Setujui" untuk menyetujui, atau "Tolak" dengan menyertakan alasan penolakan.',
        'Karyawan yang disetujui cutinya akan otomatis berstatus Cuti pada hari terkait di rekap absensi.'
      ],
      tips: 'Persetujuan cuti akan otomatis memotong kuota cuti tahunan karyawan.',
      directPath: '/admin/cuti',
      directLabel: 'Buka Kelola Cuti',
      icon: CalendarDays
    },
    {
      id: 'approval-izin',
      title: 'Pengelolaan Izin & Surat Dokter',
      category: 'operasional',
      badge: 'Izin & Sakit',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Memproses izin sakit dan izin keperluan penting karyawan, memverifikasi dokumen surat keterangan dokter, dan memberikan persetujuan.',
      steps: [
        'Buka menu Operasional → Izin.',
        'Periksa rincian tanggal, kategori izin (Sakit/Izin Keperluan), dan dokumen bukti lampiran surat dokter.',
        'Klik foto lampiran surat dokter untuk melihat keaslian dokumen.',
        'Klik tombol "Setujui" atau "Tolak" permohonan izin staf.'
      ],
      tips: 'Izin yang disetujui akan mencegah karyawan tercatat Alpha (tanpa keterangan).',
      directPath: '/admin/izin',
      directLabel: 'Buka Kelola Izin',
      icon: ShieldCheck
    },
    {
      id: 'approval-lembur',
      title: 'Persetujuan Jam Lembur Karyawan',
      category: 'operasional',
      badge: 'Lembur',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Meninjau pengajuan lembur di luar jam kerja normal untuk dimasukkan ke dalam perhitungan kompensasi uang lembur pada payroll.',
      steps: [
        'Buka menu Operasional → Lembur.',
        'Periksa tanggal lembur, jam mulai dan selesai lembur, serta tugas yang diselesaikan.',
        'Verifikasi apakah jam lembur tersebut sesuai dengan kebutuhan operasional perusahaan.',
        'Klik "Setujui" agar jam lembur resmi tercatat untuk perhitungan gaji/payroll.'
      ],
      tips: 'Lembur yang disetujui akan otomatis dikalkulasikan ke nominal slip gaji.',
      directPath: '/admin/lembur',
      directLabel: 'Buka Kelola Lembur',
      icon: Clock
    },
    {
      id: 'reimbursement-inventaris',
      title: 'Reimbursement & Inventaris Barang Perusahaan',
      category: 'operasional',
      badge: 'Klaim & Aset',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Klaim penggantian dana operasional karyawan dengan bukti nota, serta pengelolaan inventaris aset perusahaan yang dipinjamkan.',
      steps: [
        'Reimbursement: Buka menu Operasional → Reimburse untuk memeriksa nota kuitansi dan nominal klaim uang karyawan.',
        'Setujui klaim yang valid agar dapat dicairkan pada periode payroll.',
        'Inventaris: Buka menu Operasional → Inventaris untuk mencatat laptop, kendaraan, atau alat kerja yang dipegang oleh karyawan.',
        'Pantau kondisi aset (Baik/Rusak) dan tanggal penyerahan.'
      ],
      tips: 'Pastikan foto nota bukti reimbursement terbaca jelas sebelum menyetujui.',
      directPath: '/admin/reimbursement',
      directLabel: 'Buka Reimbursement',
      icon: ReceiptText
    },
    {
      id: 'payroll-gaji',
      title: 'Setelan Gaji & Pembayaran Payroll Karyawan',
      category: 'payroll',
      badge: 'Penggajian',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Mengatur komponen gaji pokok dan tunjangan per karyawan, memproses perhitungan gaji bulanan, transfer, dan menerbitkan slip gaji resmi.',
      steps: [
        'Setelan Gaji: Buka menu Gaji → Setelan Gaji untuk menginput nominal gaji pokok, tunjangan makan, transport, dan jabatan tiap staf.',
        'Pembayaran Payroll: Buka menu Gaji → Bayar Gaji untuk memproses periode penggajian bulanan.',
        'Sistem otomatis menghitung penambahan bonus/lembur serta potongan keterlambatan/absen.',
        'Lakukan verifikasi pembayaran dan rilis slip gaji agar staf dapat mengunduh slip PDF di dashboard mereka.'
      ],
      tips: 'Anda juga dapat memberikan bonus kinerja khusus melalui menu Gaji → Bonus.',
      directPath: '/admin/payroll',
      directLabel: 'Buka Kelola Payroll',
      icon: Coins
    },
    {
      id: 'lokasi-geofencing',
      title: 'Pengaturan Titik GPS Kantor & Radius Absensi',
      category: 'pengaturan',
      badge: 'Geofencing GPS',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      description: 'Menentukan koordinat latitude/longitude kantor Jakarta & Bogor serta batas radius (meter) untuk membatasi lokasi absensi karyawan secara presisi.',
      steps: [
        'Buka menu Pengaturan → Lokasi Kantor.',
        'Gunakan peta interaktif atau masukkan koordinat Latitude dan Longitude kantor.',
        'Tentukan batas Radius Toleransi (misal: 100 meter dari titik pusat kantor).',
        'Klik tombol "Simpan Pengaturan Lokasi".',
        'Karyawan yang berada di luar radius tidak akan dapat melakukan Check-In kantor normal.'
      ],
      tips: 'Karyawan yang bertugas di luar kantor wajib menggunakan menu Kunjungan Sales/Klien.',
      directPath: '/admin/lokasiKantor',
      directLabel: 'Buka Lokasi Kantor',
      icon: MapPin
    },
    {
      id: 'shift-hari-libur',
      title: 'Shift Kerja & Kelola Hari Libur Nasional',
      category: 'pengaturan',
      badge: 'Waktu Kerja',
      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
      description: 'Menyesuaikan jam masuk dan pulang untuk berbagai shift kerja, serta menandai hari libur nasional agar sistem tidak mencatat karyawan terlambat/alpa.',
      steps: [
        'Shift Kerja: Buka menu Pengaturan → Shift Kerja untuk menambah atau mengubah jam mulai dan selesai tiap shift.',
        'Hari Libur: Buka menu Pengaturan → Kelola Hari Libur untuk menambahkan hari libur nasional atau cuti bersama.',
        'Jadwal Khusus: Buka menu Pengaturan → Jadwal Khusus jika terdapat tanggal tertentu yang mewajibkan masuk atau libur khusus.'
      ],
      tips: 'Pada hari yang ditandai Hari Libur, presensi kantor tidak diwajibkan secara otomatis.',
      directPath: '/admin/shifts',
      directLabel: 'Buka Shift Kerja',
      icon: Clock
    },
    {
      id: 'keamanan-backup',
      title: 'Keamanan Akun & Backup Database',
      category: 'pengaturan',
      badge: 'Maintenance',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      description: 'Mengubah kata sandi akun Admin, memperbarui foto profil, dan mengunduh cadangan (*backup*) database sistem demi keamanan data.',
      steps: [
        'Keamanan Akun: Buka menu Pengaturan → Akun & Keamanan untuk mengganti password login Admin secara berkala.',
        'Biodata: Buka menu Pengaturan → Biodata Pribadi untuk melengkapi nomor kontak dan foto profil Anda.',
        'Backup Database: Buka menu Pengaturan → Backup & Restore untuk membuat salinan file SQL cadangan database.'
      ],
      tips: 'Lakukan backup database secara rutin setiap akhir bulan sebelum proses payroll.',
      directPath: '/admin/keamanan',
      directLabel: 'Buka Keamanan & Akun',
      icon: KeyRound
    }
  ]

  const filteredTopics = useMemo(() => {
    return topics.filter(t => {
      const matchCategory = activeCategory === 'all' || t.category === activeCategory
      const matchSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.steps.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.tips && t.tips.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchCategory && matchSearch
    })
  }, [topics, activeCategory, searchQuery])

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-5 sm:p-8 text-white shadow-xl shadow-red-600/15">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-red-50">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Panduan Resmi Admin & HRD</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              Buku Panduan Sistem Presensi & KPI HR
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              Dokumentasi lengkap tata cara pengelolaan data karyawan, monitoring to-do list & KPI, validasi presensi GPS, operasional izin cuti, serta penggajian.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-red-100">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Navigasi Cepat Aktif</span>
            </div>
            <p className="text-[11px] text-white/80 mt-1">
              Setiap panduan dilengkapi tombol direct untuk langsung membuka modul terkait.
            </p>
          </div>
        </div>

        {/* Search Bar Inside Banner */}
        <div className="relative mt-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari fitur, topik, atau kata kunci (contoh: kpi, rekap, cuti, gps, 2mb, payroll)..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white text-slate-800 placeholder-slate-400 rounded-xl text-xs sm:text-sm font-semibold shadow-md focus:outline-none focus:ring-4 focus:ring-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── CATEGORY PILLS ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-red-600 text-white shadow-sm shadow-red-600/25 scale-[1.02]'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── TOPICS LIST ── */}
      {filteredTopics.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Topik Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tidak ada panduan yang cocok dengan kata kunci "{searchQuery}". Coba gunakan kata kunci lain seperti "cuti", "kpi", atau "payroll".
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Lihat Semua Panduan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredTopics.map((topic) => {
            const TopicIcon = topic.icon
            return (
              <div
                key={topic.id}
                className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs hover:shadow-md hover:border-red-200 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Header Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 group-hover:scale-105 transition-transform">
                        <TopicIcon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${topic.badgeColor}`}>
                          {topic.badge}
                        </span>
                        <h3 className="text-xs sm:text-sm font-black text-slate-800 mt-1 leading-snug">
                          {topic.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                    {topic.description}
                  </p>

                  {/* Steps Checklist */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Langkah & Tata Cara:
                    </p>
                    <ul className="space-y-1.5">
                      {topic.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 leading-normal">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tips Note if available */}
                  {topic.tips && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold text-[10px] uppercase text-amber-700 block">Tips Penting:</span>
                        <span>{topic.tips}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Link Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                    Langsung menuju modul:
                  </span>
                  <button
                    onClick={() => navigate(topic.directPath)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm shadow-red-600/20 transition-all cursor-pointer group-hover:scale-[1.02]"
                  >
                    <span>{topic.directLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── FOOTER HELP ── */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold">Mengalami Kendala Teknis Sistem?</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hubungi tim developer support atau laporkan bug ke administrator IT perusahaan.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/15 whitespace-nowrap"
        >
          <span>Kembali ke Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  )
}
