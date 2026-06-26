import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft, Lock, FileSignature, Users, ShieldAlert, Cpu } from 'lucide-react'

export default function SecurityCompliance() {
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
            <h1 className="text-lg font-black text-slate-800 font-montserrat uppercase tracking-wide">Kepatuhan Keamanan</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">goodpeople-hcms • Portal Absensi & Payroll</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-slate-650 leading-relaxed pt-6 font-medium">
          <p>
            Di <strong>goodpeople-hcms</strong>, kami memprioritaskan keamanan informasi dan privasi data karyawan. Sistem kami dirancang secara profesional untuk mematuhi standar keamanan pengolahan data pribadi serta memastikan integritas transaksi payroll secara transparan.
          </p>

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#dc2626]" />
              1. Enkripsi Data & Komunikasi Aman
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>
                <strong>Data in Transit:</strong> Komunikasi antara peramban (browser) pengguna dengan server Laravel kami dilindungi secara mutlak menggunakan enkripsi SSL/TLS dengan protokol <strong>HTTPS</strong>. Hal ini mencegah penyadapan data oleh pihak ketiga di jaringan internet terbuka.
              </li>
              <li>
                <strong>Data at Rest:</strong> Informasi sensitif seperti kata sandi dilindungi menggunakan fungsi hash satu arah yang kuat (<strong>bcrypt</strong>) di sisi database. Kata sandi Anda tidak dapat didekripsi atau dibaca dalam bentuk teks polos, bahkan oleh administrator sistem sekalipun.
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#dc2626]" />
              2. Proteksi & Validasi Lokasi Kehadiran
            </h3>
            <p>
              Sistem presensi menggunakan algoritma matematika terverifikasi (<strong>Haversine Formula</strong>) untuk menghitung jarak lingkar bumi secara presisi antara koordinat GPS perangkat karyawan dan titik pusat kantor yang telah diatur oleh Admin. 
            </p>
            <p>
              Validasi lokasi dilakukan secara ketat di sisi server (<em>server-side verification</em>) untuk mencegah rekayasa data koordinat dari peramban client, menjamin bahwa hanya karyawan yang benar-benar berada di lokasi kerja yang dapat mencatatkan kehadirannya.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-[#dc2626]" />
              3. Tanda Tangan Digital Slip Gaji (QR Code Verification)
            </h3>
            <p>
              Setiap berkas slip gaji yang diterbitkan dan berstatus "Lunas" (<em>Paid</em>) dibekali tanda tangan digital berupa hash kriptografi SHA-256 yang aman. 
            </p>
            <p>
              Slip gaji memuat kode QR unik yang dapat dipindai oleh pihak luar berkepentingan (misal: bank, lembaga pembiayaan, dll.). Pemindaian QR tersebut akan mengarahkan penilai secara langsung ke halaman validasi publik kami untuk mencocokkan nominal gaji bersih, nama penerima, dan keaslian dokumen secara real-time untuk mencegah pemalsuan dokumen slip fisik.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <Users className="w-4 h-4 text-[#dc2626]" />
              4. Kontrol Akses Berbasis Peran (RBAC)
            </h3>
            <p>
              Hak akses dibatasi secara sistematis menggunakan Role-Based Access Control:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li><strong>Pegawai (Employee):</strong> Hanya memiliki akses baca/tulis terhadap data pribadinya, melakukan absensi, mengunggah cuti/lembur/reimbursement pribadi, dan melihat slip gajinya sendiri.</li>
              <li><strong>Admin:</strong> Memiliki akses monitoring, melakukan input data karyawan, mengajukan payroll bulanan, mengoreksi data absensi jika diizinkan, dan mengelola inventaris operasional.</li>
              <li><strong>Direktur (Director):</strong> Memiliki otoritas tertinggi untuk memberikan persetujuan mutlak atas pendaftaran karyawan, perubahan setelan gaji dasar, dan persetujuan pencairan dana payroll.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 font-montserrat flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#dc2626]" />
              5. Log Audit Sistem
            </h3>
            <p>
              Setiap aktivitas administratif penting seperti pengubahan besaran gaji karyawan oleh admin, manipulasi manual jam kehadiran, persetujuan reimbursement, dan pencairan payroll dicatat secara permanen dalam log transaksi sistem sebagai bentuk transparansi audit internal.
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
