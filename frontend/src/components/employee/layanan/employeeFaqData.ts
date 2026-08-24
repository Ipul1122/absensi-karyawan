export const EMPLOYEE_FAQ_ITEMS = [
  {
    id: 'absen-kantor',
    question: 'Bagaimana cara absen masuk dan pulang di kantor?',
    answer:
      'Buka menu Absen → Absen Kantor. Izinkan akses lokasi dan kamera, lalu lakukan Check In saat tiba dan Check Out sebelum pulang. Pastikan Anda berada dalam radius kantor yang ditetapkan perusahaan.'
  },
  {
    id: 'kunjungan',
    question: 'Apa perbedaan absen Sales dan Kunjungan Klien?',
    answer:
      'Absen Sales digunakan untuk aktivitas lapangan tim sales. Kunjungan Klien digunakan saat meeting atau visit ke lokasi klien. Pilih jenis absen yang sesuai agar riwayat dan laporan akurat.'
  },
  {
    id: 'terlambat',
    question: 'Kapan status dianggap terlambat atau normal?',
    answer:
      'Check in sebelum 08:30 dianggap datang lebih awal. Antara 08:30–09:00 status normal. Setelah 09:00 tercatat terlambat. Check out sebelum 17:00 pulang cepat, 17:00–18:00 normal, setelah 18:00 dapat tercatat lembur sesuai kebijakan.'
  },
  {
    id: 'cuti-izin',
    question: 'Bagaimana mengajukan cuti atau izin?',
    answer:
      'Dari dashboard, gunakan Aksi Cepat → Ajukan Cuti atau Izin, atau buka menu Operasional di sidebar. Isi formulir dan kirim; status persetujuan dapat dipantau hingga disetujui HR/atasan.'
  },
  {
    id: 'lembur',
    question: 'Bagaimana cara mengajukan lembur?',
    answer:
      'Pilih Lembur di Aksi Cepat atau menu Operasional → Pengajuan Lembur. Ajukan sesuai tanggal dan jam lembur aktual. Lembur yang disetujui akan tercatat untuk keperluan administrasi dan payroll.'
  },
  {
    id: 'riwayat',
    question: 'Di mana melihat riwayat absensi saya?',
    answer:
      'Tab Riwayat di navigasi bawah (mobile) atau menu Riwayat Presensi di sidebar. Anda dapat memfilter per bulan, tanggal, dan jenis absen (kantor, sales, klien).'
  },
  {
    id: 'slip-gaji',
    question: 'Bagaimana melihat slip gaji?',
    answer:
      'Buka Slip Gaji dari Aksi Cepat atau menu Payroll di sidebar. Daftar slip per periode akan ditampilkan sesuai data yang dirilis HR.'
  },
  {
    id: 'notifikasi',
    question: 'Bagaimana mengaktifkan pengingat absensi di HP?',
    answer:
      'Masuk ke Profil/Pengaturan Akun, lalu aktifkan notifikasi push browser. Setelah diizinkan, sistem dapat mengirim pengingat absensi sesuai pengaturan perusahaan.'
  },
  {
    id: 'kendala',
    question: 'GPS atau kamera gagal saat absen, apa yang harus dilakukan?',
    answer:
      'Pastikan izin lokasi dan kamera aktif untuk browser ini, refresh halaman, dan coba lagi di area dengan sinyal stabil. Jika masih gagal, hubungi HRD melalui menu Bantuan.'
  }
] as const
