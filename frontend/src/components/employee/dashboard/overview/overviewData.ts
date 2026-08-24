import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Clock, Headphones, HelpCircle, Mail, Megaphone, Users, Wallet } from 'lucide-react'

export const COMPANY_NEWS = [
  {
    date: '17 Mei 2024',
    title: 'Yasodana Parvez Buka Kantor Cabang Baru di Bandung',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80'
  },
  {
    date: '15 Mei 2024',
    title: 'Workshop Leader Meningkatkan Produktivitas Tim',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80'
  },
  {
    date: '10 Mei 2024',
    title: 'Pelatihan Digital Skills untuk Seluruh Divisi',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  },
  {
    date: '8 Mei 2024',
    title: 'Program Kesehatan Karyawan Tahun 2024',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=400&q=80'
  }
] as const

export type QuickActionItem = {
  label: string
  icon: LucideIcon
  iconClass: string
  path: string
}

export const QUICK_ACTIONS: QuickActionItem[] = [
  { label: 'Ajukan Cuti', icon: CalendarDays, iconClass: 'text-emerald-600', path: '/employee/cuti' },
  { label: 'Izin', icon: Mail, iconClass: 'text-blue-600', path: '/employee/izin' },
  { label: 'Lembur', icon: Clock, iconClass: 'text-[#FF5A00]', path: '/employee/lembur' },
  { label: 'Slip Gaji', icon: Wallet, iconClass: 'text-purple-500', path: '/employee/payroll' }
]

export type ServiceShortcutItem = {
  label: string
  icon: LucideIcon
  swal?: { title: string; text: string; icon: 'info' | 'question' }
  faq?: boolean
  path?: string
}

export const DESKTOP_AGENDA = [
  {
    title: 'Meeting Tim IT',
    time: '09:00 – 10:30 WIB',
    when: 'Besok',
    type: 'meeting'
  },
  {
    title: 'Training Cyber Security',
    time: '14:00 – 16:00 WIB',
    when: 'Jumat',
    type: 'training'
  },
  {
    title: 'Payroll Agustus',
    time: 'Akan dibuka',
    when: 'Senin',
    type: 'payroll'
  }
] as const

export const SERVICE_SHORTCUTS: ServiceShortcutItem[] = [
  { label: 'Direktori Karyawan', icon: Users, path: '/employee/biodata' },
  {
    label: 'Pengumuman',
    icon: Megaphone,
    swal: { title: 'Pengumuman', text: 'Kanal pengumuman internal perusahaan.', icon: 'info' }
  },
  {
    label: 'FAQ',
    icon: HelpCircle,
    faq: true
  },
  {
    label: 'Bantuan',
    icon: Headphones,
    swal: { title: 'Bantuan HRD', text: 'Silakan hubungi HRD jika ada kendala teknis.', icon: 'info' }
  }
]
