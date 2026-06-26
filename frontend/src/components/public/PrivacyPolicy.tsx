import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, Eye, Lock, MapPin, RefreshCw } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4 sm:p-8 font-quicksand">
      {/* Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-orange-100/30 blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full bg-red-50/20 blur-3xl translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="max-w-2xl w-full bg-white border border-orange-100 rounded-3xl p-6 sm:p-10 shadow-xl shadow-orange-950/5 relative overflow-hidden z-10 my-8">
        {/* Top Decorative line */}
        <div className="absolute top-0 left-0 w-full h-[4px] bg-[#dc2626]" />

        {/* Back Link */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-450 hover:text-[#dc2626] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Login
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-orange-100/60">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#dc2626] flex items-center justify-center shadow-inner shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 font-montserrat uppercase tracking-wide">Kebijakan Privasi</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">goodpeople-hcms • Portal Absensi & Payroll</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-slate-650 leading-relaxed pt-6 font-medium">
          <p>
            Selamat datang di <strong>goodpeople-hcms</strong>. Kami berkomitmen untuk melindungi informasi pribadi Anda dan menjaga transparansi dalam pengumpulan serta penggunaan data di lingkungan kerja <strong>PT Cakrawala Parama Internasional</strong> dan <strong>PT Yasodana Parvez Internasional</strong>. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menyimpan, dan memproses data Anda saat menggunakan aplikasi portal karyawan kami.
          </p>

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#dc2626]" />
              1. Informasi yang Kami Kumpulkan
            </h3>
            <p>
              Untuk mendukung keabsahan presensi dan perhitungan gaji, aplikasi mengumpulkan data berikut:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Data Profil Utama:</strong> Nama lengkap, alamat email Google/Gmail, kata sandi terenkripsi, divisi, nomor rekening bank, dan nomor telepon WhatsApp.
              </li>
              <li>
                <strong>Foto Swafoto (Selfie):</strong> Diambil pada saat melakukan <em>Check-In</em> dan <em>Check-Out</em> sebagai bukti visual kehadiran Anda.
              </li>
              <li>
                <strong>Koordinat GPS (Lokasi):</strong> Lokasi geografis (Latitude & Longitude) Anda dicatat secara eksklusif hanya saat menekan tombol presensi untuk memastikan Anda berada di dalam radius kantor. Aplikasi <strong>tidak</strong> melacak lokasi Anda secara terus-menerus di latar belakang.
              </li>
              <li>
                <strong>Dokumen Operasional:</strong> Berkas/dokumen surat keterangan dokter/cuti, nota klaim reimbursement, dan catatan lembur yang Anda unggah secara sukarela.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#dc2626]" />
              2. Bagaimana Kami Menggunakan Informasi Anda
            </h3>
            <p>
              Informasi yang dikumpulkan digunakan semata-mata untuk kepentingan internal perusahaan:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Memverifikasi kepatuhan kehadiran kerja karyawan secara akurat.</li>
              <li>Menghitung gaji pokok, tunjangan kehadiran (makan & transport), lembur, denda keterlambatan, dan potongan tetap bulanan.</li>
              <li>Menyediakan slip gaji elektronik resmi berkode QR untuk verifikasi tanda tangan digital.</li>
              <li>Mendukung alur persetujuan permohonan operasional (cuti, reimbursement, lembur, dan bonus) oleh manajemen dan direktur.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#dc2626]" />
              3. Penyimpanan dan Keamanan Data
            </h3>
            <p>
              Kami mengimplementasikan langkah-langkah keamanan teknis untuk melindungi data Anda:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Seluruh kata sandi dienkripsi menggunakan algoritma hashing satu arah yang aman sebelum disimpan dalam database.</li>
              <li>Akses transmisi data dienkripsi dengan protokol HTTPS standar industri.</li>
              <li>Akses terhadap data administrasi karyawan dan payroll dibatasi ketat hanya untuk admin yang berwenang dan jajaran direktur.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#dc2626]" />
              4. Transparansi Pelacakan Lokasi
            </h3>
            <p>
              Sistem pelacakan lokasi berbasis GPS hanya dijalankan secara aktif di sisi browser/aplikasi Anda pada saat Anda menekan tombol Check-In atau Check-Out. Kami sangat menghormati privasi Anda di luar jam kerja dan memastikan tidak ada aktivitas pelacakan latar belakang yang berjalan.
            </p>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-orange-50 text-[10px] text-slate-400 font-bold text-center">
            Pembaruan Terakhir: Juni 2026 • © 2026 goodpeople-hcms. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  )
}
