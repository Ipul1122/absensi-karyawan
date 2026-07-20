import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, UserCheck, AlertTriangle, Key, HeartHandshake } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-4 sm:p-8 font-quicksand">
      {/* Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-100/30 blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-red-50/20 blur-3xl -translate-x-1/3 translate-y-1/3" />
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
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 font-montserrat uppercase tracking-wide">Ketentuan Layanan</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">goodpeople-hcms • Portal Absensi & Payroll</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-slate-650 leading-relaxed pt-6 font-medium">
          <p>
            Dengan mengakses dan menggunakan portal <strong>goodpeople-hcms</strong>, Anda selaku karyawan dari <strong>PT Cakrawala Parama Internasional</strong> atau <strong>PT Yasodana Parvez Internasional</strong> secara sadar menyetujui untuk terikat dengan syarat dan ketentuan penggunaan di bawah ini.
          </p>

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#dc2626]" />
              1. Pendaftaran & Kelayakan Pengguna
            </h3>
            <p>
              Akun pengguna portal ini hanya dibuat oleh administrator sistem (Admin Utama) atas nama perusahaan bagi karyawan yang aktif terdaftar. Karyawan wajib memberikan informasi data pribadi secara akurat untuk kebutuhan profil biodata dan administrasi rekening penggajian.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
              2. Ketentuan Integritas Presensi & Larangan Manipulasi
            </h3>
            <p>
              Sistem absensi mandiri berlandaskan prinsip kepercayaan dan kejujuran.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-650">
              <li>
                <strong>Absensi Lokasi GPS Riil:</strong> Karyawan hanya diperbolehkan melakukan absensi saat berada secara fisik di dalam radius area kantor yang disyaratkan.
              </li>
              <li>
                <strong>Larangan Spoofing/Lokasi Palsu:</strong> Penggunaan aplikasi pihak ketiga untuk memalsukan posisi GPS (<em>mock location</em>), VPN, proxy, emulator, browser yang dimodifikasi, atau metode manipulasi koordinat lainnya dilarang keras.
              </li>
              <li>
                <strong>Keaslian Swafoto:</strong> Foto selfie yang diunggah saat Check-In/Check-Out harus berupa foto wajah langsung karyawan bersangkutan pada waktu riil, bukan mengunggah gambar cetak atau foto orang lain.
              </li>
              <li>
                <strong>Sanksi Pelanggaran:</strong> Setiap upaya manipulasi data kehadiran yang terdeteksi oleh sistem pemantauan admin akan langsung ditindaklanjuti dengan sanksi administratif berupa pemotongan upah, surat peringatan (SP), hingga pemutusan hubungan kerja sesuai peraturan perusahaan.
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <Key className="w-4 h-4 text-[#dc2626]" />
              3. Kerahasiaan Kredensial Akun
            </h3>
            <p>
              Anda bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi portal Anda. Jangan memberikan akses login Anda kepada rekan kerja atau pihak luar mana pun. Segala aktivitas yang dilakukan menggunakan akun Anda akan dianggap sebagai tindakan resmi yang dilakukan oleh Anda.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#dc2626]" />
              4. Kewenangan Administratif Perusahaan
            </h3>
            <p>
              Manajemen perusahaan berhak menentukan serta mengubah pengaturan konfigurasi waktu operasional, hari libur kerja nasional, besaran kompensasi dasar gaji, tunjangan, serta nilai denda keterlambatan/mangkir yang berlaku di sistem secara berkala demi tercapainya efektivitas kerja yang optimal.
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
