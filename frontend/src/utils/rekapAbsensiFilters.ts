export type RekapAbsensiViewMode = 'daily' | 'monthly'
export type RekapAbsensiSubTab = 'attendance' | 'sales_visits' | 'client_visits'

export interface RekapAbsensiFilters {
  search: string
  selectedCompany: string
  reportMonth: string
  startDate: string
  endDate: string
  statusIn: string
  statusOut: string
  viewMode: RekapAbsensiViewMode
  currentPage: number
  itemsPerPage: number
  activeSubTab: RekapAbsensiSubTab
}

const STORAGE_KEY = 'admin_rekap_absensi_filters'
const MONTH_PATTERN = /^\d{4}-\d{2}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidMonth(value: unknown): value is string {
  return typeof value === 'string' && MONTH_PATTERN.test(value)
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || DATE_PATTERN.test(value))
}

function isValidPageNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function getTodayDateStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function getDefaultReportMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getDefaultRekapAbsensiFilters(): RekapAbsensiFilters {
  const today = getTodayDateStr()
  return {
    search: '',
    selectedCompany: 'all',
    reportMonth: getDefaultReportMonth(),
    startDate: today,
    endDate: today,
    statusIn: 'all',
    statusOut: 'all',
    viewMode: 'daily',
    currentPage: 1,
    itemsPerPage: 15,
    activeSubTab: 'attendance',
  }
}

function isValidSubTab(value: unknown): value is RekapAbsensiSubTab {
  return value === 'attendance' || value === 'sales_visits' || value === 'client_visits'
}

export function loadRekapAbsensiFilters(): RekapAbsensiFilters {
  const defaults = getDefaultRekapAbsensiFilters()

  if (typeof window === 'undefined') {
    return defaults
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults

    const parsed = JSON.parse(raw) as Partial<RekapAbsensiFilters>
    return {
      ...defaults,
      search: typeof parsed.search === 'string' ? parsed.search : defaults.search,
      selectedCompany: typeof parsed.selectedCompany === 'string' ? parsed.selectedCompany : defaults.selectedCompany,
      reportMonth: isValidMonth(parsed.reportMonth) ? parsed.reportMonth : defaults.reportMonth,
      startDate: isValidDate(parsed.startDate) ? parsed.startDate : defaults.startDate,
      endDate: isValidDate(parsed.endDate) ? parsed.endDate : defaults.endDate,
      statusIn: typeof parsed.statusIn === 'string' ? parsed.statusIn : defaults.statusIn,
      statusOut: typeof parsed.statusOut === 'string' ? parsed.statusOut : defaults.statusOut,
      viewMode: parsed.viewMode === 'monthly' ? 'monthly' : 'daily',
      currentPage: isValidPageNumber(parsed.currentPage) ? Math.floor(parsed.currentPage) : defaults.currentPage,
      itemsPerPage: isValidPageNumber(parsed.itemsPerPage) ? Math.floor(parsed.itemsPerPage) : defaults.itemsPerPage,
      activeSubTab: isValidSubTab(parsed.activeSubTab) ? parsed.activeSubTab : defaults.activeSubTab,
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return defaults
  }
}

export function saveRekapAbsensiFilters(filters: RekapAbsensiFilters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // Abaikan jika storage penuh / tidak tersedia
  }
}

export function clearRekapAbsensiFiltersStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
