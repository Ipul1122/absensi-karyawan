export interface Attendance {
  id: number
  date: string
  clock_in: string | null
  clock_out: string | null
  status_in: string | null
  status_out: string | null
  attendance_type?: string | null
}

export type AttendanceState = 'loading' | 'needs_checkin' | 'needs_checkout' | 'completed' | 'day_off'

export interface ProfileSummary {
  name?: string
  division?: string | null
  company?: string | null
}

export interface OverviewUser {
  id: number
  name: string
}
