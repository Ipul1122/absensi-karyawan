import { useEffect, useState } from 'react'
import axios from 'axios'
import type { Attendance, AttendanceState, ProfileSummary } from '../overviewTypes'
import DesktopAttendanceHero from './DesktopAttendanceHero'
import DesktopStatsRow from './DesktopStatsRow'
import DesktopQuickActionsInsight from './DesktopQuickActionsInsight'
import DesktopCompanyNews from './DesktopCompanyNews'
import DesktopRightWidgets from './DesktopRightWidgets'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'director'
}

interface EmployeeOverviewDesktopProps {
  user: User
  token: string
  time: Date
  todayAttendance: Attendance | null
  attendanceState: AttendanceState
  getLiveCheckInStatus: () => { text: string; colorClass: string }
  getLiveCheckOutStatus: () => { text: string; colorClass: string }
  history: Attendance[]
  profile?: ProfileSummary | null
  officeName?: string | null
}

function countApprovedDaysInMonth(
  rows: { start_date?: string; end_date?: string; status?: string }[],
  ref: Date
): number {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  let total = 0
  rows.forEach((row) => {
    if (row.status && row.status !== 'approved') return
    if (!row.start_date) return
    const start = new Date(row.start_date)
    const end = new Date(row.end_date || row.start_date)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getFullYear() === y && d.getMonth() === m) total += 1
    }
  })
  return total
}

export default function EmployeeOverviewDesktop({
  token,
  time,
  todayAttendance,
  attendanceState,
  getLiveCheckInStatus,
  getLiveCheckOutStatus,
  history,
  officeName
}: EmployeeOverviewDesktopProps) {
  const [izinDays, setIzinDays] = useState(0)
  const [cutiDays, setCutiDays] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [leavesRes, permitsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/leaves', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:8000/api/permits', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        if (cancelled) return
        if (leavesRes.data?.status === 'success') {
          setCutiDays(countApprovedDaysInMonth(leavesRes.data.data ?? [], time))
        }
        if (permitsRes.data?.status === 'success') {
          setIzinDays(countApprovedDaysInMonth(permitsRes.data.data ?? [], time))
        }
      } catch {
        /* statistik opsional */
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [token, time.getMonth(), time.getFullYear()])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-start">
      <div className="xl:col-span-8 flex flex-col gap-6 min-w-0">
        <DesktopAttendanceHero
          time={time}
          todayAttendance={todayAttendance}
          attendanceState={attendanceState}
          getLiveCheckInStatus={getLiveCheckInStatus}
          getLiveCheckOutStatus={getLiveCheckOutStatus}
        />
        <DesktopStatsRow history={history} time={time} izinDays={izinDays} cutiDays={cutiDays} />
        <DesktopQuickActionsInsight attendanceState={attendanceState} />
        <DesktopCompanyNews />
      </div>
      <div className="xl:col-span-4 min-w-0">
        <DesktopRightWidgets time={time} todayAttendance={todayAttendance} officeName={officeName} />
      </div>
    </div>
  )
}
