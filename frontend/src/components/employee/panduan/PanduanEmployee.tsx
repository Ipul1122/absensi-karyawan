import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Search,
  ArrowRight,
  Clock,
  Building,
  Compass,
  CheckSquare,
  History,
  CalendarDays,
  ClipboardList,
  ReceiptText,
  Coins,
  User,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  ShieldCheck
} from 'lucide-react'

interface GuideTopic {
  id: string
  title: string
  category: 'presensi' | 'kpi' | 'operasional' | 'payroll' | 'akun'
  badge: string
  badgeColor: string
  description: string
  steps: string[]
  tips?: string
  directPath: string
  directLabel: string
  icon: any
}

export default function PanduanEmployee() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = [
    { id: 'all', label: 'Semua Panduan', icon: BookOpen },
    { id: 'presensi', label: 'Presensi & GPS', icon: Clock },
    { id: 'kpi', label: 'To-Do List (KPI)', icon: CheckSquare },
    { id: 'operasional', label: 'Cuti, Izin & Lembur', icon: CalendarDays },
    { id: 'payroll', label: 'Gaji & Bonus', icon: Coins },
    { id: 'akun', label: 'Akun & Profil', icon: User },
  ]

  const topics: GuideTopic[] = [
    {
      id: 'absen-kantor',
      title: 'Absen Masuk & Pulang di Kantor (Check-In & Check-Out)',
      category: 'presensi',
      badge: 'Absensi Kantor',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      description: 'Tata cara melakukan presensi resmi kantor menggunakan verifikasi kamera selfie dan deteksi lokasi GPS. Check-In wajib berada dalam radius area kantor yang ditentukan perusahaan, sedangkan Check-Out bebas batas radius.',
      steps: [
        'Buka menu Absen Mandiri → Absen Kantor.',
        'Pastikan GPS aktif dan izinkan browser mengakses kamera serta lokasi Anda.',
        'Posisikan wajah Anda pada kamera selfie dengan pencahayaan yang cukup.',
        'Klik tombol "Check In" saat tiba di kantor (sistem memvalidasi jarak radius kantor).',
        'Klik tombol "Check Out" saat pulang kerja (bebas batas radius, titik koordinat tetap tercatat).'
      ],
      tips: 'Jadwal jam kerja: Sebelum 08.30 Datang Awal, 08.30 - 09.00 Normal/Tepat Waktu, Lewat 09.00 Terlambat. Jam pulang normal mulai pukul 17.30.',
      directPath: '/employee/absen',
      directLabel: 'Buka Absen Kantor',
      icon: Building
    },
    {
      id: 'absen-kunjungan',
      title: 'Kunjungan Lapangan (Sales & Klien)',
      category: 'presensi',
      badge: 'Luar Kantor',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Presensi khusus saat Anda bertugas di luar kantor, baik untuk meeting dengan klien maupun kegiatan kunjungan penjualan tim sales di lapangan.',
      steps: [
        'Absen Sales: Buka menu Absen Mandiri → Kunjungan Sales jika Anda melakukan canvassing atau visit prospek.',
        'Kunjungan Klien: Buka menu Absen Mandiri → Kunjungan Klien jika Anda meeting di lokasi perusahaan klien.',
        'Isi nama klien atau tempat kunjungan serta catatan agenda pertemuan.',
        'Ambil foto bukti selfie di lokasi klien dan klik tombol Check In / Check Out.'
      ],
      tips: 'Pastikan nama klien dan catatan agenda terisi jelas agar diverifikasi oleh atasan.',
      directPath: '/employee/client',
      directLabel: 'Buka Kunjungan Klien',
      icon: Compass
    },
    {
      id: 'kpi-todo-list',
      title: 'Mengisi Target & To-Do List Harian (KPI)',
      category: 'kpi',
      badge: 'To-Do List Harian',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      description: 'Mencatat pekerjaan yang Anda kerjakan setiap hari, melampirkan foto bukti (< 2MB), mengelola status (🟢 Selesai, 🟡 Revisi, 🔴 Proses), dan mengirim laporan harian ke atasan.',
      steps: [
        'Buka menu Target & To-Do List di sidebar navigasi.',
        'Ketik nama pekerjaan yang Anda kerjakan pada kolom input, lalu tekan Enter atau klik "Tambah Tugas".',
        'Pilih status tugas secara fleksibel: 🔴 Proses (sedang dikerjakan), 🟡 Revisi (perlu perbaikan), atau 🟢 Selesai (sudah tuntas).',
        'Lampirkan foto bukti pekerjaan pada setiap butir tugas (Batas maksimal ukuran foto adalah 2MB per gambar).',
        'Gunakan tombol "Buat" jika ingin memasukkan banyak pekerjaan sekaligus dalam satu form cepat.',
        'Gunakan tombol "Kemarin" untuk menarik otomatis tugas kemarin yang belum selesai tanpa perlu mengetik ulang.',
        'Di akhir hari kerja, klik tombol "Kirim Laporan" untuk mengirim rekapitulasi pekerjaan Anda ke Admin HR & Direktur.'
      ],
      tips: '🟢 Hijau = Telah Selesai, 🟡 Kuning = Revisi, 🔴 Merah = Proses. Ketercapaian dihitung otomatis dari tugas yang berstatus 🟢 Selesai.',
      directPath: '/employee/kpi',
      directLabel: 'Buka To-Do List & KPI',
      icon: CheckSquare
    },
    {
      id: 'riwayat-absensi',
      title: 'Melihat Riwayat Absensi & Kehadiran Saya',
      category: 'presensi',
      badge: 'Riwayat Kehadiran',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      description: 'Memeriksa rekapitulasi catatan jam masuk, jam pulang, keterlambatan, foto presensi, serta status kehadiran Anda pada bulan berjalan.',
      steps: [
        'Buka menu Riwayat Absen di sidebar navigasi.',
        'Pilih bulan dan tahun yang ingin Anda periksa.',
        'Lihat rincian tanggal, jam masuk, jam pulang, dan status (Tepat Waktu, Terlambat, Izin, atau Cuti).',
        'Klik baris absensi untuk melihat foto selfie dan peta koordinat saat Anda absen.'
      ],
      tips: 'Jika terdapat ketidaksesuaian jam karena kendala teknis perangkat, hubungi staf HR untuk koreksi resmi.',
      directPath: '/employee/riwayat',
      directLabel: 'Buka Riwayat Absen',
      icon: History
    },
    {
      id: 'pengajuan-cuti',
      title: 'Cara Mengajukan Cuti Tahunan',
      category: 'operasional',
      badge: 'Cuti Tahunan',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      description: 'Mengajukan permohonan libur cuti tahunan, memeriksa sisa jatah kuota cuti Anda, dan memantau status persetujuan dari pihak HRD.',
      steps: [
        'Buka menu Operasional → Pengajuan Cuti.',
        'Lihat sisa kuota cuti tahunan Anda yang tertera di bagian atas.',
        'Klik tombol "+ Ajukan Cuti".',
        'Pilih tanggal mulai cuti dan tanggal selesai cuti.',
        'Tuliskan alasan pengajuan cuti secara jelas dan sopan, lalu klik "Kirim Pengajuan".',
        'Pantau status apakah pengajuan Anda berstatus "Menunggu Persetujuan" atau "Disetujui".'
      ],
      tips: 'Ajukan cuti minimal beberapa hari sebelum tanggal pelaksanaan agar HR dan tim dapat mengantisipasi pekerjaan.',
      directPath: '/employee/cuti',
      directLabel: 'Buka Pengajuan Cuti',
      icon: CalendarDays
    },
    {
      id: 'pengajuan-izin',
      title: 'Pengajuan Izin Tidak Masuk & Sakit',
      category: 'operasional',
      badge: 'Izin & Sakit',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      description: 'Memberitahukan ketidakhadiran karena sakit atau keperluan keluarga mendesak dengan melampirkan foto dokumen surat keterangan dokter.',
      steps: [
        'Buka menu Operasional → Pengajuan Izin.',
        'Klik tombol "+ Ajukan Izin".',
        'Pilih kategori izin (Sakit / Izin Keperluan Mendesak).',
        'Tentukan tanggal izin dan tuliskan keterangan alasan ketidakhadiran.',
        'Jika sakit, unggah foto surat keterangan dokter yang sah.',
        'Kirim pengajuan dan tunggu persetujuan dari HRD.'
      ],
      tips: 'Izin yang disetujui akan mencegah status Anda tercatat Alpha pada rekap kehadiran bulanan.',
      directPath: '/employee/izin',
      directLabel: 'Buka Pengajuan Izin',
      icon: ClipboardList
    },
    {
      id: 'pengajuan-lembur',
      title: 'Pengajuan Jam Kerja Lembur',
      category: 'operasional',
      badge: 'Lembur',
      badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
      description: 'Mencatatkan jam kerja lembur yang ditugaskan di luar jam kerja normal agar mendapatkan perhitungan kompensasi lembur pada slip gaji.',
      steps: [
        'Buka menu Operasional → Pengajuan Lembur.',
        'Klik tombol "+ Ajukan Lembur".',
        'Pilih tanggal lembur, tentukan jam mulai dan jam selesai lembur.',
        'Jelaskan rincian tugas atau target pekerjaan yang Anda selesaikan selama lembur.',
        'Kirim pengajuan untuk diverifikasi dan disetujui oleh atasan / HRD.'
      ],
      tips: 'Pengajuan lembur harus sesuai instruksi atau persetujuan atasan sebelum dikerjakan.',
      directPath: '/employee/lembur',
      directLabel: 'Buka Pengajuan Lembur',
      icon: Clock
    },
    {
      id: 'klaim-reimbursement',
      title: 'Pengajuan Klaim Reimbursement Biaya Operasional',
      category: 'operasional',
      badge: 'Reimbursement',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      description: 'Mengajukan penggantian biaya pribadi yang terpakai untuk keperluan kantor (bensin, tol, konsumsi meeting, dll) dengan menyertakan bukti struk/kuitansi.',
      steps: [
        'Buka menu Operasional → Reimbursement.',
        'Klik tombol "+ Ajukan Klaim".',
        'Masukkan nominal biaya dan jelaskan keperluan pengeluaran dana tersebut.',
        'Ambil foto struk, kuitansi, atau bukti transfer pembayaran yang asli dan jelas.',
        'Kirim permohonan klaim. Setelah disetujui HRD, dana akan dicairkan pada periode payroll.'
      ],
      tips: 'Pastikan foto nota bukti tidak blur dan tertera tanggal serta nominal yang sesuai.',
      directPath: '/employee/reimbursement',
      directLabel: 'Buka Reimbursement',
      icon: ReceiptText
    },
    {
      id: 'slip-gaji-bonus',
      title: 'Melihat Slip Gaji & Riwayat Bonus Performa',
      category: 'payroll',
      badge: 'Gaji & Bonus',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      description: 'Melihat rincian slip gaji resmi yang diterbitkan perusahaan setiap bulan, mengunduh file slip PDF, dan memeriksa riwayat bonus.',
      steps: [
        'Slip Gaji: Buka menu Slip Gaji di sidebar navigasi untuk melihat daftar slip per periode bulan.',
        'Periksa rincian gaji pokok, tunjangan, uang lembur, serta potongan keterlambatan/BPJS.',
        'Klik tombol "Download Slip Gaji" untuk mengunduh dokumen resmi format PDF.',
        'Bonus Saya: Buka menu Operasional → Bonus Saya untuk melihat catatan apresiasi bonus kinerja dari manajemen.'
      ],
      tips: 'Slip gaji bersifat rahasia (confidential) dan hanya dapat diakses oleh akun Anda sendiri.',
      directPath: '/employee/payroll',
      directLabel: 'Buka Slip Gaji',
      icon: Coins
    },
    {
      id: 'pengaturan-profil',
      title: 'Pengaturan Profil, Password & Rekening Bank',
      category: 'akun',
      badge: 'Profil & Akun',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      description: 'Memperbarui kata sandi akun, memasang foto profil terbaru, melengkapi nomor WhatsApp aktif, dan memastikan nomor rekening bank tepat untuk payroll.',
      steps: [
        'Atur Akun: Buka menu Pengaturan → Atur Akun untuk mengganti kata sandi login secara berkala demi keamanan.',
        'Atur Biodata: Buka menu Pengaturan → Atur Biodata untuk melengkapi nomor WhatsApp aktif dan nomor rekening bank transfer gaji.',
        'Pasang foto profil formal yang jelas agar foto Anda dikenali saat verifikasi presensi.'
      ],
      tips: 'Pastikan nomor rekening bank selalu mutakhir agar proses transfer gaji berjalan lancar.',
      directPath: '/employee/pengaturan',
      directLabel: 'Buka Atur Akun',
      icon: User
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
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-orange-500 via-amber-600 to-red-600 p-5 sm:p-8 text-white shadow-xl shadow-orange-500/15">
        <div className="absolute right-0 top-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-orange-50">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Panduan Karyawan & Staf</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
              Buku Panduan Aplikasi Absensi & To-Do List
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 max-w-2xl leading-relaxed">
              Pelajari tata cara presensi GPS, pengisian to-do list harian (KPI), arti lingkaran status (🟢 Selesai, 🟡 Revisi, 🔴 Proses), pengajuan cuti/izin, serta download slip gaji.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/20 shrink-0 self-start md:self-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-100">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Direct Link Aktif</span>
            </div>
            <p className="text-[11px] text-white/80 mt-1">
              Klik tombol merah pada setiap panduan untuk langsung menuju halaman fitur terkait.
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
            placeholder="Cari panduan (contoh: absen, to-do list, lingkaran, 2mb, cuti, lembur, slip gaji)..."
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
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/25 scale-[1.02]'
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
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Panduan Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tidak ada panduan yang cocok dengan kata kunci "{searchQuery}". Coba kata kunci umum seperti "absen", "kpi", atau "cuti".
          </p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  {/* Header Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 group-hover:scale-105 transition-transform">
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
                      Petunjuk Langkah-Langkah:
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
                        <span className="font-extrabold text-[10px] uppercase text-amber-700 block">Tips & Ketentuan:</span>
                        <span>{topic.tips}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Link Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                    Buka halaman langsung:
                  </span>
                  <button
                    onClick={() => navigate(topic.directPath)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-sm shadow-orange-600/20 transition-all cursor-pointer group-hover:scale-[1.02]"
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
            <ShieldCheck className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold">Mengalami Kendala atau Pertanyaan Lain?</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Hubungi staf HR / Admin kantor Anda jika ada kendala presensi, koreksi data, atau izin darurat.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/employee/dashboard')}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/15 whitespace-nowrap"
        >
          <span>Kembali ke Beranda</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  )
}
