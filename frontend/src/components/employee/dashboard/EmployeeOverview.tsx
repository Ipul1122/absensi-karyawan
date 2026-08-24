import CompanyNewsSection from './overview/CompanyNewsSection'
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
  const { time, attendanceState } = props

  return (
    <>
      <div className="md:hidden flex flex-col gap-6">
        <OverviewQuickAccess time={time} attendanceState={attendanceState} />
        <QuickActionsSection />
        <CompanyNewsSection />
        <ServiceShortcutsSection />
      </div>
      <div className="hidden md:block">
        <EmployeeOverviewDesktop {...props} />
      </div>
    </>
  )
}
