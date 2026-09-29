import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import WorkShortcutsSection from './overview/WorkShortcutsSection'
import OverviewQuickAccess from './overview/OverviewQuickAccess'
import QuickActionsSection from './overview/QuickActionsSection'
import ServiceShortcutsSection from './overview/ServiceShortcutsSection'
import EmployeeOverviewDesktop from './overview/desktop/EmployeeOverviewDesktop'
import type { Attendance, AttendanceState, ProfileSummary } from './overview/overviewTypes'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
}

interface EmployeeOverviewProps {
  user: User
  token: string
  time: Date
  todayAttendance: Attendance | null
  attendanceState: AttendanceState
  getLiveCheckInStatus: () => { text: string; colorClass: string }
  getLiveCheckOutStatus: () => { text: string; colorClass: string }
  formatDate: (date: Date) => string
  history: Attendance[]
  profile?: ProfileSummary | null
  officeName?: string | null
}

export default function EmployeeOverview(props: EmployeeOverviewProps) {
  const { user, time, attendanceState, todayAttendance } = props
  const navigate = useNavigate()

  useEffect(() => {
    // Jika karyawan sudah melakukan check-in hari ini, tampilkan toast pengingat jika belum pernah tampil di sesi ini
    if (todayAttendance?.clock_in) {
      const todayStr = new Date().toISOString().slice(0, 10)
      const sessionKey = `kpi_toast_shown_${todayStr}`
      if (!sessionStorage.getItem(sessionKey)) {
        const timer = setTimeout(() => {
          sessionStorage.setItem(sessionKey, 'true')
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Jangan lupa buat laporan kerja',
            text: 'Anda sudah Check-In hari ini. Yuk buat to-do list & laporan kerja!',
            showConfirmButton: true,
            confirmButtonText: 'Buat Laporan',
            confirmButtonColor: '#dc2626',
            showCancelButton: true,
            cancelButtonText: 'Nanti',
            cancelButtonColor: '#64748b',
            timer: 6500,
            timerProgressBar: true,
            background: '#ffffff',
            color: '#1e293b',
            customClass: {
              popup: 'shadow-2xl border border-red-200 rounded-xl'
            }
          }).then((result) => {
            if (result.isConfirmed) {
              navigate('/employee/kpi')
            }
          })
        }, 600)

        return () => clearTimeout(timer)
      }
    }
  }, [todayAttendance?.clock_in, user?.id, navigate])

  return (
    <>
      <div className="md:hidden flex flex-col gap-6">
        <OverviewQuickAccess time={time} attendanceState={attendanceState} />
        <WorkShortcutsSection />
        <QuickActionsSection />
        <ServiceShortcutsSection />
      </div>
      <div className="hidden md:block">
        <EmployeeOverviewDesktop {...props} />
      </div>
    </>
  )
}
