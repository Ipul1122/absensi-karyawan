const ORANGE_SHELL_ROUTE =
  /^\/employee\/(dashboard|absen|sales|client|riwayat|pengaturan|biodata|cuti|izin|payroll|reimbursement|bonus|lembur)\/?$/

/** Semua halaman fitur karyawan memakai header orange + layout shell */
export function isEmployeeOrangeShellPath(pathname: string): boolean {
  return ORANGE_SHELL_ROUTE.test(pathname)
}

/** @deprecated gunakan isEmployeeOrangeShellPath */
export function isEmployeePrimaryShellPath(pathname: string): boolean {
  return isEmployeeOrangeShellPath(pathname)
}

export function isEmployeeDashboardPath(pathname: string): boolean {
  return pathname.endsWith('/dashboard') || pathname.endsWith('/dashboard/')
}

/** Tab bottom nav: sapaan lengkap + konteks halaman */
export function isEmployeeMainTabPath(pathname: string): boolean {
  return (
    /\/employee\/dashboard\/?$/.test(pathname) ||
    /\/employee\/absen\/?$/.test(pathname) ||
    /\/employee\/riwayat\/?$/.test(pathname) ||
    /\/employee\/pengaturan\/?$/.test(pathname)
  )
}

export function getEmployeeHeaderVariant(
  pathname: string
): 'home' | 'main' | 'feature' {
  if (isEmployeeDashboardPath(pathname)) return 'home'
  if (isEmployeeMainTabPath(pathname)) return 'main'
  return 'feature'
}
