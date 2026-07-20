import { useState, useEffect } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'
import { getAssetUrl } from '../../../utils/api'
import { 
  FileCheck, 
  Loader2, 
  Check, 
  X, 
  Calendar, 
  Clock, 
  Receipt, 
  Gift, 
  CalendarDays,
  ExternalLink,
  CheckCircle2,
  Package,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  // Download,
  ArrowUpDown,
  BookOpen,
  Trash2
} from 'lucide-react'


interface UserBrief { id: number; name: string; email: string }

interface LeaveRequest {
  id: number; user_id: number; category: string; custom_category: string | null
  start_date: string; end_date: string; reason: string; image: string | null
  status: string; admin_notes: string | null; user: UserBrief
  created_at: string; updated_at: string
}

interface PermitRequest {
  id: number; user_id: number; category: string; custom_category: string | null
  start_date: string; end_date: string; reason: string; image: string | null
  status: string; admin_notes: string | null; user: UserBrief
  created_at: string; updated_at: string
}

interface OvertimeRequest {
  id: number; user_id: number; date: string; start_time: string; end_time: string
  duration: number; reason: string; status: string; admin_notes: string | null; user: UserBrief
  created_at: string; updated_at: string
}

interface ReimbursementRequest {
  id: number; user_id: number; title: string; category: string; amount: number
  expense_date: string; description: string | null; receipt_path: string; status: string
  admin_notes: string | null; user: UserBrief
  created_at: string; updated_at: string
}

interface BonusRequest {
  id: number; user_id: number; bonus_amount: number; bonus_date: string
  description: string | null; status: string; user: UserBrief
  created_at: string; updated_at: string
}

interface InventoryRequest {
  id: number
  nama_barang: string
  tanggal_pembelian: string
  harga: number
  foto: string | null
  lokasi: string
  struk_pembelian: string | null
  pemakai_barang: string | null
  kondisi_barang: 'ori' | 'second'
  status: string
  admin_notes: string | null
}

interface PersetujuanOperationalProps { token: string }
type ActiveSubTab = 'cuti' | 'izin' | 'lembur' | 'reimbursement' | 'bonus' | 'inventaris' | 'recap'

const S = { fontFamily: "'Inter', 'system-ui', sans-serif" }

const tabDefs = [
  { key: 'cuti' as const, label: 'Cuti', icon: CalendarDays, color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.20)', gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)' },
  { key: 'izin' as const, label: 'Izin', icon: BookOpen, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.20)', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
  { key: 'lembur' as const, label: 'Lembur', icon: Clock, color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.20)', gradient: 'linear-gradient(135deg,#d97706,#b45309)' },
  { key: 'reimbursement' as const, label: 'Reimburse', icon: Receipt, color: '#0891b2', bg: 'rgba(8,145,178,0.08)', border: 'rgba(8,145,178,0.20)', gradient: 'linear-gradient(135deg,#0891b2,#0e7490)' },
  { key: 'bonus' as const, label: 'Bonus', icon: Gift, color: '#059669', bg: 'rgba(5,150,105,0.08)', border: 'rgba(5,150,105,0.20)', gradient: 'linear-gradient(135deg,#059669,#047857)' },
  { key: 'inventaris' as const, label: 'Inventaris', icon: Package, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.20)', gradient: 'linear-gradient(135deg,#f97316,#ea580c)' },
  { key: 'recap' as const, label: 'Rekap & Export', icon: FileSpreadsheet, color: '#ec4899', bg: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.20)', gradient: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
]


export default function PersetujuanOperational({ token }: PersetujuanOperationalProps) {
  const [activeTab, setActiveTab] = useState<ActiveSubTab>('cuti')
  const [loading, setLoading] = useState(true)
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [permits, setPermits] = useState<PermitRequest[]>([])
  const [overtimes, setOvertimes] = useState<OvertimeRequest[]>([])
  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>([])
  const [bonuses, setBonuses] = useState<BonusRequest[]>([])
  const [inventories, setInventories] = useState<InventoryRequest[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [r1, r1_2, r2, r3, r4, r5] = await Promise.all([
        axios.get('http://localhost:8000/api/admin/leaves', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/permits', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/overtimes', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/reimbursements', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/bonuses', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:8000/api/admin/inventories', { headers }).catch(() => ({ data: { data: [] } })),
      ])
      setLeaves(r1.data?.data || [])
      setPermits(r1_2.data?.data || [])
      setOvertimes(r2.data?.data || [])
      setReimbursements(r3.data?.data || [])
      setBonuses(r4.data?.data || [])
      setInventories(r5.data?.data || [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const fmt = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const cleanTime = timeString.substring(0, 5)
    const [hourStr] = cleanTime.split(':')
    const hour = parseInt(hourStr, 10)
    
    let period = 'malam'
    if (hour >= 4 && hour < 11) {
      period = 'pagi'
    } else if (hour >= 11 && hour < 15) {
      period = 'siang'
    } else if (hour >= 15 && hour < 18) {
      period = 'sore'
    }
    
    return `${cleanTime} ${period}`
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    const timeFormatted = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
    return `${dateFormatted}, ${timeFormatted} WIB`
  }

  const pendingLeaves = leaves.filter(l => l.status === 'pending_director')
  const pendingPermits = permits.filter(p => p.status === 'pending_director')
  const pendingOvertimes = overtimes.filter(o => o.status === 'pending_director')
  const pendingReimbursements = reimbursements.filter(r => r.status === 'pending_director')
  const pendingBonuses = bonuses.filter(b => b.status === 'pending')
  const pendingInventories = inventories.filter(i => i.status === 'pending')

  const counts: Record<ActiveSubTab, number> = {
    cuti: pendingLeaves.length,
    izin: pendingPermits.length,
    lembur: pendingOvertimes.length,
    reimbursement: pendingReimbursements.length,
    bonus: pendingBonuses.length,
    inventaris: pendingInventories.length,
    recap: 0
  }

  interface NormalizedRecord {
    id: string;
    type: 'cuti' | 'izin' | 'lembur' | 'reimbursement' | 'bonus' | 'inventaris';
    employeeName: string;
    employeeEmail: string;
    dateStr: string;
    dateObj: Date;
    amount: number | null;
    amountStr: string;
    details: string;
    status: string;
    raw: any;
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'desc' | 'asc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, categoryFilter, sortBy, monthFilter, yearFilter])



  const normalizedRecords: NormalizedRecord[] = [
    ...leaves.map(l => ({
      id: `cuti-${l.id}`,
      type: 'cuti' as const,
      employeeName: l.user?.name || 'Karyawan',
      employeeEmail: l.user?.email || '',
      dateStr: l.start_date && l.end_date ? `${new Date(l.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — ${new Date(l.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : '-',
      dateObj: l.start_date ? new Date(l.start_date) : new Date(),
      amount: null,
      amountStr: '-',
      details: `Kategori: ${l.category === 'LAINNYA' ? l.custom_category || 'Lainnya' : l.category} | Alasan: ${l.reason}`,
      status: l.status,
      raw: l
    })),
    ...permits.map(p => ({
      id: `izin-${p.id}`,
      type: 'izin' as const,
      employeeName: p.user?.name || 'Karyawan',
      employeeEmail: p.user?.email || '',
      dateStr: p.start_date && p.end_date ? `${new Date(p.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — ${new Date(p.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}` : '-',
      dateObj: p.start_date ? new Date(p.start_date) : new Date(),
      amount: null,
      amountStr: '-',
      details: `Kategori: ${p.category === 'LAINNYA' ? p.custom_category || 'Lainnya' : p.category} | Alasan: ${p.reason}`,
      status: p.status,
      raw: p
    })),
    ...overtimes.map(o => ({
      id: `lembur-${o.id}`,
      type: 'lembur' as const,
      employeeName: o.user?.name || 'Karyawan',
      employeeEmail: o.user?.email || '',
      dateStr: o.date ? new Date(o.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      dateObj: o.date ? new Date(o.date) : new Date(),
      amount: o.duration,
      amountStr: `${o.duration} jam`,
      details: `Jam: ${o.start_time?.substring(0, 5) || ''} — ${o.end_time?.substring(0, 5) || ''} | Alasan: ${o.reason}`,
      status: o.status,
      raw: o
    })),
    ...reimbursements.map(r => ({
      id: `reimburse-${r.id}`,
      type: 'reimbursement' as const,
      employeeName: r.user?.name || 'Karyawan',
      employeeEmail: r.user?.email || '',
      dateStr: r.expense_date ? new Date(r.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      dateObj: r.expense_date ? new Date(r.expense_date) : new Date(),
      amount: r.amount,
      amountStr: fmt(r.amount),
      details: `[${r.category}] ${r.title} ${r.description ? `| Ket: ${r.description}` : ''}`,
      status: r.status,
      raw: r
    })),
    ...bonuses.map(b => ({
      id: `bonus-${b.id}`,
      type: 'bonus' as const,
      employeeName: b.user?.name || 'Karyawan',
      employeeEmail: b.user?.email || '',
      dateStr: b.bonus_date ? new Date(b.bonus_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      dateObj: b.bonus_date ? new Date(b.bonus_date) : new Date(),
      amount: b.bonus_amount,
      amountStr: fmt(b.bonus_amount),
      details: `Keterangan: ${b.description || '-'}`,
      status: b.status,
      raw: b
    })),
    ...inventories.map(i => ({
      id: `inventaris-${i.id}`,
      type: 'inventaris' as const,
      employeeName: i.pemakai_barang || 'Kantor',
      employeeEmail: `Lokasi: ${i.lokasi}`,
      dateStr: i.tanggal_pembelian ? new Date(i.tanggal_pembelian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
      dateObj: i.tanggal_pembelian ? new Date(i.tanggal_pembelian) : new Date(),
      amount: i.harga,
      amountStr: fmt(i.harga),
      details: `Barang: ${i.nama_barang} | Kondisi: ${i.kondisi_barang?.toUpperCase()}`,
      status: i.status,
      raw: i
    }))
  ];

  const availableYears = Array.from(
    new Set(normalizedRecords.map(rec => rec.dateObj.getFullYear()))
  ).sort((a, b) => b - a);
  const yearsList = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];


  const filteredRecords = normalizedRecords.filter(rec => {
    const query = searchQuery.toLowerCase();
    const matchSearch = rec.employeeName.toLowerCase().includes(query) ||
      rec.employeeEmail.toLowerCase().includes(query) ||
      rec.details.toLowerCase().includes(query);
    
    let matchStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        matchStatus = rec.status === 'pending' || rec.status === 'pending_director';
      } else {
        matchStatus = rec.status === statusFilter;
      }
    }

    const matchCategory = categoryFilter === 'all' || rec.type === categoryFilter;

    let matchMonth = true;
    if (monthFilter !== 'all') {
      const monthNum = parseInt(monthFilter, 10);
      matchMonth = rec.dateObj.getMonth() === monthNum;
    }

    let matchYear = true;
    if (yearFilter !== 'all') {
      const yearNum = parseInt(yearFilter, 10);
      matchYear = rec.dateObj.getFullYear() === yearNum;
    }

    return matchSearch && matchStatus && matchCategory && matchMonth && matchYear;
  }).sort((a, b) => {
    const timeA = a.dateObj.getTime();
    const timeB = b.dateObj.getTime();
    return sortBy === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);


  const stats = {
    cuti: {
      total: leaves.length,
      approved: leaves.filter(l => l.status === 'approved').length,
      pending: leaves.filter(l => l.status === 'pending_director' || l.status === 'pending').length,
    },
    izin: {
      total: permits.length,
      approved: permits.filter(p => p.status === 'approved').length,
      pending: permits.filter(p => p.status === 'pending_director' || p.status === 'pending').length,
    },
    lembur: {
      total: overtimes.length,
      approvedHours: overtimes.filter(o => o.status === 'approved').reduce((a, b) => a + Number(b.duration), 0),
      pendingHours: overtimes.filter(o => o.status === 'pending_director' || o.status === 'pending').reduce((a, b) => a + Number(b.duration), 0),
    },
    reimburse: {
      total: reimbursements.length,
      approvedAmount: reimbursements.filter(r => r.status === 'approved').reduce((a, b) => a + Number(b.amount), 0),
      pendingAmount: reimbursements.filter(r => r.status === 'pending_director' || r.status === 'pending').reduce((a, b) => a + Number(b.amount), 0),
    },
    bonus: {
      total: bonuses.length,
      approvedAmount: bonuses.filter(b => b.status === 'approved').reduce((a, b) => a + Number(b.bonus_amount), 0),
      pendingAmount: bonuses.filter(b => b.status === 'pending').reduce((a, b) => a + Number(b.bonus_amount), 0),
    },
    inventaris: {
      total: inventories.length,
      approvedAmount: inventories.filter(i => i.status === 'approved').reduce((a, b) => a + Number(b.harga), 0),
      pendingAmount: inventories.filter(i => i.status === 'pending').reduce((a, b) => a + Number(b.harga), 0),
    }
  };

  const escapeXML = (str: string | null | undefined): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const exportToExcelXML = () => {
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Direktur - Absensi Karyawan</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:CharSet="1" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#4f46e5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderLembur">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#d97706" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderReimburse">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0891b2" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderBonus">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#059669" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="HeaderInventaris">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#f97316" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;Rp&quot;#,##0"/>
  </Style>
  <Style ss:ID="Date">
   <NumberFormat ss:Format="yyyy-mm-dd"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:FontName="Calibri" ss:Bold="1"/>
  </Style>
 </Styles>
`;

    // Cuti Sheet
    xml += ` <Worksheet ss:Name="Cuti">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Karyawan</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Email</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kategori Cuti</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mulai Cuti</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Selesai Cuti</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Alasan</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;
    leaves.forEach(l => {
      const catText = l.category === 'LAINNYA' ? l.custom_category || 'Lainnya' : l.category;
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXML(l.user?.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(l.user?.email)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(catText)}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${l.start_date || ''}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${l.end_date || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(l.reason)}</Data></Cell>
    <Cell><Data ss:Type="String">${l.status}</Data></Cell>
   </Row>`;
    });
    xml += `  </Table>
 </Worksheet>
`;

    // Izin Sheet
    xml += ` <Worksheet ss:Name="Izin">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nama Karyawan</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Email</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Kategori Izin</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mulai Izin</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Selesai Izin</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Alasan</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;
    permits.forEach(p => {
      const catText = p.category === 'LAINNYA' ? p.custom_category || 'Lainnya' : p.category;
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXML(p.user?.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.user?.email)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(catText)}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${p.start_date || ''}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${p.end_date || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(p.reason)}</Data></Cell>
    <Cell><Data ss:Type="String">${p.status}</Data></Cell>
   </Row>`;
    });
    xml += `  </Table>
 </Worksheet>
`;

    // Lembur Sheet
    xml += ` <Worksheet ss:Name="Lembur">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderLembur"><Data ss:Type="String">Nama Karyawan</Data></Cell>
    <Cell ss:StyleID="HeaderLembur"><Data ss:Type="String">Tanggal</Data></Cell>
    <Cell ss:StyleID="HeaderLembur"><Data ss:Type="String">Mulai</Data></Cell>
    <Cell ss:StyleID="HeaderLembur"><Data ss:Type="String">Selesai</Data></Cell>
    <Cell ss:StyleID="HeaderLembur"><Data ss:Type="String">Durasi (Jam)</Data></Cell>
    <Cell ss:StyleID="HeaderLembur"><Data ss:Type="String">Alasan</Data></Cell>
    <Cell ss:StyleID="HeaderLembur"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;
    overtimes.forEach(o => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXML(o.user?.name)}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${o.date || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${o.start_time || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${o.end_time || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${o.duration}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(o.reason)}</Data></Cell>
    <Cell><Data ss:Type="String">${o.status}</Data></Cell>
   </Row>`;
    });
    xml += `  </Table>
 </Worksheet>
`;

    // Reimburse Sheet
    xml += ` <Worksheet ss:Name="Reimburse">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="200"/>
   <Column ss:Width="100"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderReimburse"><Data ss:Type="String">Nama Karyawan</Data></Cell>
    <Cell ss:StyleID="HeaderReimburse"><Data ss:Type="String">Kategori</Data></Cell>
    <Cell ss:StyleID="HeaderReimburse"><Data ss:Type="String">Judul Klaim</Data></Cell>
    <Cell ss:StyleID="HeaderReimburse"><Data ss:Type="String">Tanggal Belanja</Data></Cell>
    <Cell ss:StyleID="HeaderReimburse"><Data ss:Type="String">Nominal</Data></Cell>
    <Cell ss:StyleID="HeaderReimburse"><Data ss:Type="String">Keterangan</Data></Cell>
    <Cell ss:StyleID="HeaderReimburse"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;
    reimbursements.forEach(r => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXML(r.user?.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.category)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.title)}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${r.expense_date || ''}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${r.amount}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(r.description || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${r.status}</Data></Cell>
   </Row>`;
    });
    xml += `  </Table>
 </Worksheet>
`;

    // Bonus Sheet
    xml += ` <Worksheet ss:Name="Bonus">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="250"/>
   <Column ss:Width="100"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderBonus"><Data ss:Type="String">Nama Karyawan</Data></Cell>
    <Cell ss:StyleID="HeaderBonus"><Data ss:Type="String">Tanggal Pembagian</Data></Cell>
    <Cell ss:StyleID="HeaderBonus"><Data ss:Type="String">Nominal Bonus</Data></Cell>
    <Cell ss:StyleID="HeaderBonus"><Data ss:Type="String">Keterangan</Data></Cell>
    <Cell ss:StyleID="HeaderBonus"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;
    bonuses.forEach(b => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXML(b.user?.name)}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${b.bonus_date || ''}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${b.bonus_amount}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(b.description || '')}</Data></Cell>
    <Cell><Data ss:Type="String">${b.status}</Data></Cell>
   </Row>`;
    });
    xml += `  </Table>
 </Worksheet>
`;

    // Inventaris Sheet
    xml += ` <Worksheet ss:Name="Inventaris">
  <Table>
   <Column ss:Width="150"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderInventaris"><Data ss:Type="String">Nama Barang</Data></Cell>
    <Cell ss:StyleID="HeaderInventaris"><Data ss:Type="String">Tanggal Beli</Data></Cell>
    <Cell ss:StyleID="HeaderInventaris"><Data ss:Type="String">Harga</Data></Cell>
    <Cell ss:StyleID="HeaderInventaris"><Data ss:Type="String">Lokasi</Data></Cell>
    <Cell ss:StyleID="HeaderInventaris"><Data ss:Type="String">Kondisi</Data></Cell>
    <Cell ss:StyleID="HeaderInventaris"><Data ss:Type="String">Pemakai</Data></Cell>
    <Cell ss:StyleID="HeaderInventaris"><Data ss:Type="String">Status</Data></Cell>
   </Row>`;
    inventories.forEach(i => {
      xml += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXML(i.nama_barang)}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${i.tanggal_pembelian || ''}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${i.harga}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(i.lokasi)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(i.kondisi_barang)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXML(i.pemakai_barang || 'Kantor')}</Data></Cell>
    <Cell><Data ss:Type="String">${i.status}</Data></Cell>
   </Row>`;
    });
    xml += `  </Table>
 </Worksheet>
`;

    xml += `</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Operational_Recap_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;
    const approvedPermits = permits.filter(p => p.status === 'approved').length;
    const approvedOvertimes = overtimes.filter(o => o.status === 'approved');
    const totalOvertimeHours = approvedOvertimes.reduce((acc, curr) => acc + Number(curr.duration), 0);
    const approvedReimbursements = reimbursements.filter(r => r.status === 'approved');
    const totalReimbursements = approvedReimbursements.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const approvedBonuses = bonuses.filter(b => b.status === 'approved');
    const totalBonuses = approvedBonuses.reduce((acc, curr) => acc + Number(curr.bonus_amount), 0);
    const approvedInventories = inventories.filter(i => i.status === 'approved');
    const totalInventories = approvedInventories.reduce((acc, curr) => acc + Number(curr.harga), 0);

    const formatDate = (d: string) => {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    let html = `
      <html>
        <head>
          <title>Rekapitulasi Operasional SDM - Direktur</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 30px;
              background-color: #ffffff;
              font-size: 11px;
            }
            .header-container {
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 20px;
              margin-bottom: 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .subtitle {
              font-size: 12px;
              color: #64748b;
              margin: 6px 0 0 0;
            }
            .meta-info {
              text-align: right;
              font-size: 11px;
              color: #64748b;
              line-height: 1.5;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 12px;
              margin-bottom: 30px;
            }
            .stat-card {
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 14px;
              background-color: #f8fafc;
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .stat-title {
              font-size: 9px;
              font-weight: 800;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.75px;
              margin-bottom: 6px;
            }
            .stat-value {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }
            .section {
              margin-bottom: 35px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 12px;
              border-left: 4px solid #4f46e5;
              padding-left: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .section-title.lembur { border-left-color: #d97706; }
            .section-title.izin { border-left-color: #8b5cf6; }
            .section-title.reimburse { border-left-color: #0891b2; }
            .section-title.bonus { border-left-color: #059669; }
            .section-title.inventaris { border-left-color: #f97316; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #e2e8f0;
              padding: 10px 12px;
              text-align: left;
              line-height: 1.4;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 800;
              color: #475569;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .text-right { text-align: right; }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 8px;
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.25px;
            }
            .badge-approved { background-color: #dcfce7; color: #15803d; }
            .badge-pending { background-color: #fef9c3; color: #a16207; }
            .badge-rejected { background-color: #fee2e2; color: #b91c1c; }
            .page-break {
              page-break-after: always;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div>
              <h1 class="title">REKAP LAPORAN OPERASIONAL SDM</h1>
              <p class="subtitle">Rekapitulasi persetujuan cuti, izin, lembur, reimburse, bonus, dan inventaris barang</p>
            </div>
            <div class="meta-info">
              <p style="margin:0;"><strong>Diekspor Oleh:</strong> Direktur</p>
              <p style="margin:4px 0 0 0;"><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card" style="border-top: 4px solid #4f46e5;">
              <div class="stat-title">Disetujui Cuti</div>
              <div class="stat-value">${approvedLeaves} Pengajuan</div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #8b5cf6;">
              <div class="stat-title">Disetujui Izin</div>
              <div class="stat-value">${approvedPermits} Pengajuan</div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #d97706;">
              <div class="stat-title">Lembur Disetujui</div>
              <div class="stat-value">${totalOvertimeHours} Jam</div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #0891b2;">
              <div class="stat-title">Reimburse Disetujui</div>
              <div class="stat-value">${formatIDR(totalReimbursements)}</div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #059669;">
              <div class="stat-title">Bonus Disetujui</div>
              <div class="stat-value">${formatIDR(totalBonuses)}</div>
            </div>
            <div class="stat-card" style="border-top: 4px solid #f97316;">
              <div class="stat-title">Inventaris Disetujui</div>
              <div class="stat-value">${formatIDR(totalInventories)}</div>
            </div>
          </div>

          <!-- 1. CUTI -->
          <div class="section">
            <h2 class="section-title">1. Pengajuan Cuti Karyawan</h2>
            <table>
              <thead>
                <tr>
                  <th>Nama Karyawan</th>
                  <th>Kategori Cuti</th>
                  <th>Tanggal Cuti</th>
                  <th>Alasan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${leaves.length === 0 ? `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada data pengajuan cuti</td></tr>` : 
                  leaves.map(l => `
                    <tr>
                      <td><strong>${escapeXML(l.user?.name)}</strong><br/><span style="color: #64748b; font-size: 9px;">${escapeXML(l.user?.email)}</span></td>
                      <td>${escapeXML(l.category === 'LAINNYA' ? l.custom_category || 'Lainnya' : l.category)}</td>
                      <td>${formatDate(l.start_date)} - ${formatDate(l.end_date)}</td>
                      <td>${escapeXML(l.reason)}</td>
                      <td><span class="badge ${l.status === 'approved' ? 'badge-approved' : l.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${l.status}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- 1.2. IZIN -->
          <div class="section">
            <h2 class="section-title izin">1.2. Pengajuan Izin Karyawan</h2>
            <table>
              <thead>
                <tr>
                  <th>Nama Karyawan</th>
                  <th>Kategori Izin</th>
                  <th>Tanggal Izin</th>
                  <th>Alasan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${permits.length === 0 ? `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada data pengajuan izin</td></tr>` : 
                  permits.map(p => `
                    <tr>
                      <td><strong>${escapeXML(p.user?.name)}</strong><br/><span style="color: #64748b; font-size: 9px;">${escapeXML(p.user?.email)}</span></td>
                      <td>${escapeXML(p.category === 'LAINNYA' ? p.custom_category || 'Lainnya' : p.category)}</td>
                      <td>${formatDate(p.start_date)} - ${formatDate(p.end_date)}</td>
                      <td>${escapeXML(p.reason)}</td>
                      <td><span class="badge ${p.status === 'approved' ? 'badge-approved' : p.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${p.status}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- 2. LEMBUR -->
          <div class="section">
            <h2 class="section-title lembur">2. Pengajuan Lembur Karyawan</h2>
            <table>
              <thead>
                <tr>
                  <th>Nama Karyawan</th>
                  <th>Tanggal Lembur</th>
                  <th>Jam Kerja</th>
                  <th>Durasi</th>
                  <th>Alasan Lembur</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${overtimes.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada data pengajuan lembur</td></tr>` : 
                  overtimes.map(o => `
                    <tr>
                      <td><strong>${escapeXML(o.user?.name)}</strong><br/><span style="color: #64748b; font-size: 9px;">${escapeXML(o.user?.email)}</span></td>
                      <td>${formatDate(o.date)}</td>
                      <td>${o.start_time?.substring(0,5)} - ${o.end_time?.substring(0,5)}</td>
                      <td class="text-right">${o.duration} Jam</td>
                      <td>${escapeXML(o.reason)}</td>
                      <td><span class="badge ${o.status === 'approved' ? 'badge-approved' : o.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${o.status}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- 3. REIMBURSEMENT -->
          <div class="section">
            <h2 class="section-title reimburse">3. Pengajuan Klaim Reimbursement (Biaya)</h2>
            <table>
              <thead>
                <tr>
                  <th>Nama Karyawan</th>
                  <th>Kategori & Judul</th>
                  <th>Tanggal Nota</th>
                  <th class="text-right">Nominal</th>
                  <th>Keterangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reimbursements.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada data pengajuan reimbursement</td></tr>` : 
                  reimbursements.map(r => `
                    <tr>
                      <td><strong>${escapeXML(r.user?.name)}</strong><br/><span style="color: #64748b; font-size: 9px;">${escapeXML(r.user?.email)}</span></td>
                      <td><span style="font-weight: 600; color: #0891b2;">[${escapeXML(r.category)}]</span><br/>${escapeXML(r.title)}</td>
                      <td>${formatDate(r.expense_date)}</td>
                      <td class="text-right" style="font-weight: 700;">${formatIDR(r.amount)}</td>
                      <td>${escapeXML(r.description || '-')}</td>
                      <td><span class="badge ${r.status === 'approved' ? 'badge-approved' : r.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${r.status}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- 4. BONUS -->
          <div class="section">
            <h2 class="section-title bonus">4. Pengajuan Bonus Karyawan</h2>
            <table>
              <thead>
                <tr>
                  <th>Nama Karyawan</th>
                  <th>Tanggal Pembagian</th>
                  <th class="text-right">Nominal Bonus</th>
                  <th>Keterangan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${bonuses.length === 0 ? `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada data pengajuan bonus</td></tr>` : 
                  bonuses.map(b => `
                    <tr>
                      <td><strong>${escapeXML(b.user?.name)}</strong><br/><span style="color: #64748b; font-size: 9px;">${escapeXML(b.user?.email)}</span></td>
                      <td>${formatDate(b.bonus_date)}</td>
                      <td class="text-right" style="font-weight: 700; color: #059669;">${formatIDR(b.bonus_amount)}</td>
                      <td>${escapeXML(b.description || '-')}</td>
                      <td><span class="badge ${b.status === 'approved' ? 'badge-approved' : b.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${b.status}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="page-break"></div>

          <!-- 5. INVENTARIS -->
          <div class="section">
            <h2 class="section-title inventaris">5. Daftar Pengajuan Barang Inventaris</h2>
            <table>
              <thead>
                <tr>
                  <th>Nama Barang</th>
                  <th>Tanggal Pembelian</th>
                  <th class="text-right">Harga Barang</th>
                  <th>Lokasi & Pemakai</th>
                  <th>Kondisi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${inventories.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">Tidak ada data pengajuan inventaris</td></tr>` : 
                  inventories.map(i => `
                    <tr>
                      <td><strong>${escapeXML(i.nama_barang)}</strong></td>
                      <td>${formatDate(i.tanggal_pembelian)}</td>
                      <td class="text-right" style="font-weight: 700;">${formatIDR(i.harga)}</td>
                      <td>Lokasi: ${escapeXML(i.lokasi)}<br/>Pemakai: ${escapeXML(i.pemakai_barang || 'Kantor')}</td>
                      <td style="text-transform: uppercase;">${i.kondisi_barang}</td>
                      <td><span class="badge ${i.status === 'approved' ? 'badge-approved' : i.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${i.status}</span></td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 600);
    }
  };

  // Actions
  const approve = async (url: string, name?: string, imageUrl?: string) => {
    const swalOptions: any = {
      title: 'Setujui Pengajuan?',
      html: name ? `Apakah Anda yakin ingin menyetujui pengajuan untuk <strong>${name}</strong>?` : 'Apakah Anda yakin ingin menyetujui pengajuan ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Setujui',
      cancelButtonText: 'Batal'
    }
    if (imageUrl) {
      swalOptions.imageUrl = imageUrl
      swalOptions.imageHeight = 200
      swalOptions.imageAlt = 'Bukti Nota Pembelian'
      delete swalOptions.icon
    }

    const result = await Swal.fire(swalOptions)
    if (result.isConfirmed) {
      try {
        const res = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.status === 'success') { 
          Swal.fire({
            title: 'Berhasil!',
            text: res.data.message,
            icon: 'success',
            confirmButtonColor: '#10b981'
          })
          fetchData() 
        }
      } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Gagal.', 'error') }
    }
  }

  const rejectWithNotes = async (url: string, fieldName: string, imageUrl?: string) => {
    const swalOptions: any = {
      title: 'Alasan Penolakan',
      input: 'textarea',
      inputLabel: fieldName,
      inputPlaceholder: 'Tulis alasan penolakan...',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Tolak',
      cancelButtonText: 'Batal',
      inputValidator: (v: string) => { if (!v) return 'Alasan penolakan wajib diisi!' }
    }
    if (imageUrl) {
      swalOptions.imageUrl = imageUrl
      swalOptions.imageHeight = 200
      swalOptions.imageAlt = 'Bukti Nota Pembelian'
    }

    const { value: notes } = await Swal.fire(swalOptions)
    if (notes) {
      try {
        const res = await axios.put(url, { admin_notes: notes }, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.status === 'success') { Swal.fire('Ditolak!', res.data.message, 'success'); fetchData() }
      } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Gagal.', 'error') }
    }
  }

  const rejectSimple = async (url: string, name: string, imageUrl?: string) => {
    const swalOptions: any = {
      title: 'Tolak Pengajuan?',
      html: `Yakin menolak pengajuan untuk <strong>${name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Tolak',
      cancelButtonText: 'Batal'
    }
    if (imageUrl) {
      swalOptions.imageUrl = imageUrl
      swalOptions.imageHeight = 200
      swalOptions.imageAlt = 'Bukti Nota Pembelian'
      delete swalOptions.icon
    }

    const result = await Swal.fire(swalOptions)
    if (result.isConfirmed) {
      try {
        const res = await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } })
        if (res.data.status === 'success') { Swal.fire('Ditolak!', res.data.message, 'success'); fetchData() }
      } catch (err: any) { Swal.fire('Gagal', err.response?.data?.message || 'Gagal.', 'error') }
    }
  }

  const handleDelete = async (type: string, id: string | number, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Pengajuan?',
      text: `Apakah Anda yakin ingin menghapus pengajuan ${type} untuk ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    })

    if (result.isConfirmed) {
      try {
        let url = ''
        if (type === 'cuti') url = `http://localhost:8000/api/leaves/${id}`
        else if (type === 'izin') url = `http://localhost:8000/api/permits/${id}`
        else if (type === 'lembur') url = `http://localhost:8000/api/overtimes/${id}`
        else if (type === 'reimbursement') url = `http://localhost:8000/api/reimbursements/${id}`
        else if (type === 'bonus') url = `http://localhost:8000/api/admin/bonuses/${id}`
        else if (type === 'inventaris') url = `http://localhost:8000/api/admin/inventories/${id}`

        const response = await axios.delete(url, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data.status === 'success') {
          Swal.fire({
            title: 'Terhapus!',
            text: response.data.message,
            icon: 'success'
          })
          fetchData()
        }
      } catch (err: any) {
        Swal.fire('Gagal', err.response?.data?.message || 'Gagal menghapus pengajuan.', 'error')
      }
    }
  }

  const currentTab = tabDefs.find(t => t.key === activeTab)!

  const ActionButtons = ({ approveUrl, rejectUrl, rejectLabel, name, simpleReject = false, imageUrl }: {
    approveUrl: string; rejectUrl: string; rejectLabel?: string; name: string; simpleReject?: boolean; imageUrl?: string
  }) => (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => simpleReject ? rejectSimple(rejectUrl, name, imageUrl) : rejectWithNotes(rejectUrl, rejectLabel || 'Alasan', imageUrl)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
      >
        <X className="w-3.5 h-3.5" /> Tolak
      </button>
      <button
        onClick={() => approve(approveUrl, name, imageUrl)}
        className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 cursor-pointer shadow-sm"
        style={{ background: currentTab.gradient }}
      >
        <Check className="w-3.5 h-3.5" /> Setujui
      </button>
    </div>
  )

  return (
    <div className="space-y-6" style={S}>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Persetujuan Operasional SDM</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Proses pengajuan cuti, lembur, klaim biaya, dan bonus karyawan</p>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          {tabDefs.map(tab => {
            const Icon = tab.icon
            const isAct = activeTab === tab.key
            const cnt = counts[tab.key]
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border"
                style={isAct ? {
                  background: tab.bg,
                  color: tab.color,
                  borderColor: tab.border
                } : {
                  background: 'white',
                  color: '#64748b',
                  borderColor: '#e2e8f0'
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {cnt > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-black"
                    style={isAct ? { background: tab.color, color: 'white' } : { background: '#f1f5f9', color: '#64748b' }}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: currentTab.color }} />
            <p className="text-xs text-slate-400 font-medium">Memuat data operasional...</p>
          </div>
        ) : (

          /* ── CUTI ── */
          activeTab === 'cuti' ? (
            pendingLeaves.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan cuti yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori & Tanggal</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Dibuat</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Diterima</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Alasan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Bukti</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingLeaves.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black mb-1.5 uppercase tracking-wider" style={{ background: currentTab.bg, color: currentTab.color, border: `1px solid ${currentTab.border}` }}>
                            {r.category === 'LAINNYA' ? r.custom_category : r.category}
                          </span>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
                            {new Date(r.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {new Date(r.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-semibold">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">
                          -
                        </td>
                        <td className="py-4 px-6 max-w-[200px]">
                          <p className="text-xs text-slate-500 font-medium truncate" title={r.reason}>{r.reason}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {r.image ? (
                            <a href={getAssetUrl(r.image)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline" style={{ color: currentTab.color }}>
                              <ExternalLink className="w-3 h-3" /> Lihat
                            </a>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/leaves/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/leaves/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Cuti"
                            name={r.user?.name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          /* ── IZIN ── */
          ) : activeTab === 'izin' ? (
            pendingPermits.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan izin yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori & Tanggal</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Dibuat</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Diterima</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Alasan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Bukti</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingPermits.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black mb-1.5 uppercase tracking-wider" style={{ background: currentTab.bg, color: currentTab.color, border: `1px solid ${currentTab.border}` }}>
                            {r.category === 'LAINNYA' ? r.custom_category : r.category}
                          </span>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
                            {new Date(r.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {new Date(r.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-semibold">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">
                          -
                        </td>
                        <td className="py-4 px-6 max-w-[200px]">
                          <p className="text-xs text-slate-500 font-medium truncate" title={r.reason}>{r.reason}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {r.image ? (
                            <a href={getAssetUrl(r.image)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline" style={{ color: currentTab.color }}>
                              <ExternalLink className="w-3 h-3" /> Lihat
                            </a>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/permits/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/permits/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Izin"
                            name={r.user?.name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          /* ── LEMBUR ── */
          ) : activeTab === 'lembur' ? (
            pendingOvertimes.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan lembur yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal & Durasi</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Dibuat</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Diterima</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Jam</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Alasan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingOvertimes.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-semibold text-slate-700">{new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black" style={{ background: currentTab.bg, color: currentTab.color, border: `1px solid ${currentTab.border}` }}>{r.duration} jam</span>
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-semibold">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">
                          -
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-300" /> {formatTime(r.start_time)} – {formatTime(r.end_time)}
                          </p>
                        </td>
                        <td className="py-4 px-6 max-w-[180px]">
                          <p className="text-xs text-slate-500 font-medium truncate" title={r.reason}>{r.reason}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/overtimes/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/overtimes/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Lembur"
                            name={r.user?.name}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          /* ── REIMBURSEMENT ── */
          ) : activeTab === 'reimbursement' ? (
            pendingReimbursements.length === 0 ? (
              <EmptyState text="Tidak ada klaim biaya yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Judul & Kategori</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Dibuat</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Diterima</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Nominal</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Nota</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingReimbursements.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6 max-w-[240px]">
                          <p className="text-xs font-semibold text-slate-800 break-words whitespace-normal leading-normal">{r.title}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider" style={{ background: currentTab.bg, color: currentTab.color, border: `1px solid ${currentTab.border}` }}>{r.category}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(r.expense_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-semibold">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">
                          -
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm font-black text-slate-800">{fmt(r.amount)}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {r.receipt_path ? (
                            <a href={getAssetUrl(r.receipt_path)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline" style={{ color: currentTab.color }}>
                              <ExternalLink className="w-3 h-3" /> Nota
                            </a>
                          ) : <span className="text-slate-300 text-xs">-</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/reimbursements/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/reimbursements/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Klaim"
                            name={r.user?.name}
                            imageUrl={r.receipt_path ? getAssetUrl(r.receipt_path) : undefined}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          /* ── BONUS ── */
          ) : activeTab === 'bonus' ? (
            pendingBonuses.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan bonus yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal Pembagian</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Dibuat</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Diterima</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Nominal Bonus</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Keterangan</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingBonuses.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6"><EmployeeCell name={r.user?.name} email={r.user?.email} gradient={currentTab.gradient} /></td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-500">
                          <span className="block">{new Date(r.bonus_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </td>
                        <td className="py-4 px-6 text-slate-700 font-semibold">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-semibold">
                          -
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-sm font-black text-slate-800">{fmt(r.bonus_amount)}</span>
                        </td>
                        <td className="py-4 px-6 max-w-[180px]">
                          <p className="text-xs text-slate-400 font-medium truncate" title={r.description || ''}>{r.description || '-'}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/bonuses/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/bonuses/${r.id}/reject`}
                            name={r.user?.name}
                            simpleReject
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : activeTab === 'inventaris' ? (
            /* ── INVENTARIS ── */
            pendingInventories.length === 0 ? (
              <EmptyState text="Tidak ada pengajuan inventaris barang yang menunggu persetujuan." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Barang</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tgl Pembelian & Harga</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Detail</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Berkas</th>
                      <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {pendingInventories.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden bg-slate-50 shadow-sm" style={{ background: currentTab.bg, borderColor: currentTab.border }}>
                              {r.foto ? (
                                <img src={getAssetUrl(r.foto)} alt={r.nama_barang} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-extrabold text-xs" style={{ color: currentTab.color }}>{r.nama_barang?.charAt(0)?.toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{r.nama_barang}</p>
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase bg-slate-50 text-slate-500 border-slate-200">
                                {r.kondisi_barang}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-500 font-medium">
                            {new Date(r.tanggal_pembelian).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs font-black text-slate-800 mt-1">{fmt(r.harga)}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-xs text-slate-600 font-medium"><span className="text-slate-400 font-semibold">Lokasi:</span> {r.lokasi}</p>
                          <p className="text-xs text-slate-600 font-medium mt-1">
                            <span className="text-slate-400 font-semibold">Pemakai:</span> {r.pemakai_barang || 'Kantor'}
                          </p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center">
                            {r.struk_pembelian ? (
                              <a href={getAssetUrl(r.struk_pembelian)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold hover:underline" style={{ color: currentTab.color }}>
                                <ExternalLink className="w-3 h-3" /> Struk
                              </a>
                            ) : <span className="text-slate-300 text-[10px] font-medium">-</span>}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            approveUrl={`http://localhost:8000/api/director/inventories/${r.id}/approve`}
                            rejectUrl={`http://localhost:8000/api/director/inventories/${r.id}/reject`}
                            rejectLabel="Alasan Penolakan Barang Inventaris"
                            name={r.nama_barang}
                            imageUrl={r.foto ? getAssetUrl(r.foto) : undefined}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* ── REKAPAN & EXPORT ── */
            <div className="p-6 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Card 1: Cuti */}
                <div className="bg-gradient-to-br from-indigo-50/60 to-white hover:shadow-md border border-indigo-100 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute right-2 -bottom-2 text-indigo-100 opacity-20 group-hover:scale-110 transition-transform duration-300">
                    <CalendarDays className="w-16 h-16" />
                  </div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Laporan Cuti</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.cuti.approved} <span className="text-xs font-semibold text-slate-400">Disetujui</span></h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                    <span className="bg-indigo-100/50 text-indigo-700 px-1.5 py-0.5 rounded">{stats.cuti.pending} Menunggu</span>
                    <span>•</span>
                    <span>Total {stats.cuti.total}</span>
                  </div>
                </div>

                {/* Card 1.5: Izin */}
                <div className="bg-gradient-to-br from-violet-50/60 to-white hover:shadow-md border border-violet-100 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute right-2 -bottom-2 text-violet-100 opacity-20 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-16 h-16" />
                  </div>
                  <span className="text-[10px] font-black text-violet-500 uppercase tracking-wider">Laporan Izin</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.izin.approved} <span className="text-xs font-semibold text-slate-400">Disetujui</span></h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                    <span className="bg-violet-100/50 text-violet-700 px-1.5 py-0.5 rounded">{stats.izin.pending} Menunggu</span>
                    <span>•</span>
                    <span>Total {stats.izin.total}</span>
                  </div>
                </div>

                {/* Card 2: Lembur */}
                <div className="bg-gradient-to-br from-amber-50/60 to-white hover:shadow-md border border-amber-100 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute right-2 -bottom-2 text-amber-100 opacity-20 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-16 h-16" />
                  </div>
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Jam Lembur</span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{stats.lembur.approvedHours} <span className="text-xs font-semibold text-slate-400">Jam Disetujui</span></h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                    <span className="bg-amber-100/50 text-amber-700 px-1.5 py-0.5 rounded">{stats.lembur.pendingHours} Jam Pending</span>
                    <span>•</span>
                    <span>Total {stats.lembur.total}</span>
                  </div>
                </div>

                {/* Card 3: Reimburse */}
                <div className="bg-gradient-to-br from-cyan-50/60 to-white hover:shadow-md border border-cyan-100 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute right-2 -bottom-2 text-cyan-100 opacity-20 group-hover:scale-110 transition-transform duration-300">
                    <Receipt className="w-16 h-16" />
                  </div>
                  <span className="text-[10px] font-black text-cyan-600 uppercase tracking-wider">Klaim Biaya</span>
                  <h3 className="text-base font-black text-slate-800 mt-1.5 truncate" title={fmt(stats.reimburse.approvedAmount)}>{fmt(stats.reimburse.approvedAmount)}</h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                    <span className="bg-cyan-100/50 text-cyan-700 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={fmt(stats.reimburse.pendingAmount)}>{fmt(stats.reimburse.pendingAmount)} pending</span>
                    <span>•</span>
                    <span>Total {stats.reimburse.total}</span>
                  </div>
                </div>

                {/* Card 4: Bonus */}
                <div className="bg-gradient-to-br from-emerald-50/60 to-white hover:shadow-md border border-emerald-100 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute right-2 -bottom-2 text-emerald-100 opacity-20 group-hover:scale-110 transition-transform duration-300">
                    <Gift className="w-16 h-16" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Dana Bonus</span>
                  <h3 className="text-base font-black text-slate-800 mt-1.5 truncate" title={fmt(stats.bonus.approvedAmount)}>{fmt(stats.bonus.approvedAmount)}</h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                    <span className="bg-emerald-100/50 text-emerald-700 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={fmt(stats.bonus.pendingAmount)}>{fmt(stats.bonus.pendingAmount)} pending</span>
                    <span>•</span>
                    <span>Total {stats.bonus.total}</span>
                  </div>
                </div>

                {/* Card 5: Inventaris */}
                <div className="bg-gradient-to-br from-orange-50/60 to-white hover:shadow-md border border-orange-100 rounded-2xl p-4 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute right-2 -bottom-2 text-orange-100 opacity-20 group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-16 h-16" />
                  </div>
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-wider">Aset Inventaris</span>
                  <h3 className="text-base font-black text-slate-800 mt-1.5 truncate" title={fmt(stats.inventaris.approvedAmount)}>{fmt(stats.inventaris.approvedAmount)}</h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                    <span className="bg-orange-100/50 text-orange-700 px-1.5 py-0.5 rounded truncate max-w-[80px]" title={fmt(stats.inventaris.pendingAmount)}>{fmt(stats.inventaris.pendingAmount)} pending</span>
                    <span>•</span>
                    <span>Total {stats.inventaris.total}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Filters Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                {/* Export Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportToExcelXML}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari nama, detail..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-400 w-44 md:w-56 transition-all"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="text-xs bg-transparent border-none outline-none text-slate-600 font-semibold cursor-pointer py-0.5"
                    >
                      <option value="all">Semua Kategori</option>
                      <option value="cuti">Cuti</option>
                      <option value="izin">Izin</option>
                      <option value="lembur">Lembur</option>
                      <option value="reimbursement">Reimburse</option>
                      <option value="bonus">Bonus</option>
                      <option value="inventaris">Inventaris</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                    <BookOpen className="w-3 h-3 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-xs bg-transparent border-none outline-none text-slate-600 font-semibold cursor-pointer py-0.5"
                    >
                      <option value="all">Semua Status</option>
                      <option value="pending">Menunggu Persetujuan</option>
                      <option value="approved">Disetujui</option>
                      <option value="rejected">Ditolak</option>
                    </select>
                  </div>

                  {/* Month Filter */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="text-xs bg-transparent border-none outline-none text-slate-600 font-semibold cursor-pointer py-0.5"
                    >
                      <option value="all">Semua Bulan</option>
                      <option value="0">Januari</option>
                      <option value="1">Februari</option>
                      <option value="2">Maret</option>
                      <option value="3">April</option>
                      <option value="4">Mei</option>
                      <option value="5">Juni</option>
                      <option value="6">Juli</option>
                      <option value="7">Agustus</option>
                      <option value="8">September</option>
                      <option value="9">Oktober</option>
                      <option value="10">November</option>
                      <option value="11">Desember</option>
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                    <CalendarDays className="w-3 h-3 text-slate-400" />
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="text-xs bg-transparent border-none outline-none text-slate-600 font-semibold cursor-pointer py-0.5"
                    >
                      <option value="all">Semua Tahun</option>
                      {yearsList.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Order */}
                  <button
                    onClick={() => setSortBy(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {sortBy === 'desc' ? 'Terbaru' : 'Terlama'}
                  </button>
                </div>
              </div>

              {/* Table */}
              {filteredRecords.length === 0 ? (
                <EmptyState text="Tidak ada pengajuan yang cocok dengan filter pencarian Anda." />
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipe</th>
                          <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Karyawan / Pemakai</th>
                          <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Tanggal</th>
                          <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider">Detail Pengajuan</th>
                          <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Nilai / Durasi</th>
                          <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                          <th className="py-3 px-6 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {paginatedRecords.map((r) => {
                          const typeStyles = {
                            cuti: { bg: 'rgba(79,70,229,0.08)', color: '#4f46e5', border: 'rgba(79,70,229,0.20)', label: 'Cuti' },
                            izin: { bg: 'rgba(139,92,246,0.08)', color: '#8b5cf6', border: 'rgba(139,92,246,0.20)', label: 'Izin' },
                            lembur: { bg: 'rgba(217,119,6,0.08)', color: '#d97706', border: 'rgba(217,119,6,0.20)', label: 'Lembur' },
                            reimbursement: { bg: 'rgba(8,145,178,0.08)', color: '#0891b2', border: 'rgba(8,145,178,0.20)', label: 'Reimburse' },
                            bonus: { bg: 'rgba(5,150,105,0.08)', color: '#059669', border: 'rgba(5,150,105,0.20)', label: 'Bonus' },
                            inventaris: { bg: 'rgba(249,115,22,0.08)', color: '#f97316', border: 'rgba(249,115,22,0.20)', label: 'Inventaris' },
                          }[r.type];

                          const statusStyle = {
                            approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', label: 'Disetujui' },
                            rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', label: 'Ditolak' },
                            pending_director: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Menunggu Direktur' },
                            pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', label: 'Menunggu' },
                          }[r.status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', label: r.status };

                          return (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-all duration-150">
                              {/* Type Badge */}
                              <td className="py-4 px-6">
                                <span
                                  className="inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border"
                                  style={{
                                    background: typeStyles.bg,
                                    color: typeStyles.color,
                                    borderColor: typeStyles.border
                                  }}
                                >
                                  {typeStyles.label}
                                </span>
                              </td>

                              {/* Employee Info */}
                              <td className="py-4 px-6">
                                {r.type === 'inventaris' ? (
                                  <div>
                                    <p className="font-semibold text-slate-800">{r.employeeName}</p>
                                    <p className="text-[10px] text-slate-400">{r.employeeEmail}</p>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                                      style={{ background: typeStyles.color }}
                                    >
                                      {r.employeeName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800 leading-tight">{r.employeeName}</p>
                                      <p className="text-[10px] text-slate-400 leading-none mt-0.5">{r.employeeEmail}</p>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Date */}
                              <td className="py-4 px-6 text-slate-500 font-semibold">
                                {r.dateStr}
                              </td>

                              {/* Details */}
                              <td className="py-4 px-6 max-w-[280px]">
                                <p className="text-slate-600 font-medium break-words leading-relaxed">{r.details}</p>
                                {r.raw.admin_notes && (
                                  <p className="text-[10px] text-rose-500 font-semibold mt-1 italic">
                                    Catatan: {r.raw.admin_notes}
                                  </p>
                                )}
                              </td>

                              {/* Amount */}
                              <td className="py-4 px-6 text-right font-black text-slate-700">
                                {r.amountStr}
                              </td>

                              {/* Status Badge */}
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                  {statusStyle.label}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-4 px-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {(r.status === 'pending' || r.status === 'pending_director' || r.status === 'rejected') && (
                                    <button
                                      onClick={() => {
                                        let approveUrl = ''
                                        if (r.type === 'cuti') approveUrl = `http://localhost:8000/api/director/leaves/${r.id}/approve`
                                        else if (r.type === 'izin') approveUrl = `http://localhost:8000/api/director/permits/${r.id}/approve`
                                        else if (r.type === 'lembur') approveUrl = `http://localhost:8000/api/director/overtimes/${r.id}/approve`
                                        else if (r.type === 'reimbursement') approveUrl = `http://localhost:8000/api/director/reimbursements/${r.id}/approve`
                                        else if (r.type === 'bonus') approveUrl = `http://localhost:8000/api/director/bonuses/${r.id}/approve`
                                        else if (r.type === 'inventaris') approveUrl = `http://localhost:8000/api/director/inventories/${r.id}/approve`
                                        
                                        const imageUrl = r.type === 'reimbursement' && r.raw.receipt_path ? getAssetUrl(r.raw.receipt_path) : undefined
                                        approve(approveUrl, r.employeeName, imageUrl)
                                      }}
                                      className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-600 rounded-lg transition-all cursor-pointer shadow-sm"
                                      title="Setujui"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {(r.status === 'pending' || r.status === 'pending_director' || r.status === 'approved') && (
                                    <button
                                      onClick={() => {
                                        let rejectUrl = ''
                                        if (r.type === 'cuti') rejectUrl = `http://localhost:8000/api/director/leaves/${r.id}/reject`
                                        else if (r.type === 'izin') rejectUrl = `http://localhost:8000/api/director/permits/${r.id}/reject`
                                        else if (r.type === 'lembur') rejectUrl = `http://localhost:8000/api/director/overtimes/${r.id}/reject`
                                        else if (r.type === 'reimbursement') rejectUrl = `http://localhost:8000/api/director/reimbursements/${r.id}/reject`
                                        else if (r.type === 'bonus') rejectUrl = `http://localhost:8000/api/director/bonuses/${r.id}/reject`
                                        else if (r.type === 'inventaris') rejectUrl = `http://localhost:8000/api/director/inventories/${r.id}/reject`
                                        
                                        const imageUrl = r.type === 'reimbursement' && r.raw.receipt_path ? getAssetUrl(r.raw.receipt_path) : undefined
                                        
                                        if (r.type === 'bonus') {
                                          rejectSimple(rejectUrl, r.employeeName, imageUrl)
                                        } else {
                                          const label = {
                                            cuti: 'Alasan Penolakan Cuti',
                                            izin: 'Alasan Penolakan Izin',
                                            lembur: 'Alasan Penolakan Lembur',
                                            reimbursement: 'Alasan Penolakan Klaim',
                                            inventaris: 'Alasan Penolakan Barang Inventaris'
                                          }[r.type] || 'Alasan Penolakan'
                                          rejectWithNotes(rejectUrl, label, imageUrl)
                                        }
                                      }}
                                      className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-all cursor-pointer shadow-sm"
                                      title="Tolak"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(r.type, r.id, r.employeeName)}
                                    className="p-1 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-700 rounded-lg transition-all cursor-pointer shadow-sm"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="text-xs text-slate-500 font-medium">
                        Menampilkan <span className="font-bold text-slate-700">{startIndex + 1}</span> - <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, filteredRecords.length)}</span> dari <span className="font-bold text-slate-700">{filteredRecords.length}</span> data
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Sebelumnya
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center border transition-all cursor-pointer ${
                              currentPage === pageNum
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ))}

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  )
}

// Sub-components
function EmployeeCell({ name, email, gradient }: { name: string; email: string; gradient: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ background: gradient }}>
        {name?.charAt(0)?.toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{name}</p>
        <p className="text-[10px] text-slate-400 font-medium">{email}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-slate-400">Tidak ada pengajuan</p>
      <p className="text-xs text-slate-300 font-medium mt-1 text-center max-w-xs">{text}</p>
    </div>
  )
}
