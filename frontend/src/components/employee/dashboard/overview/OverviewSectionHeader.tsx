import { overviewTypography } from './overviewTheme'

interface OverviewSectionHeaderProps {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export default function OverviewSectionHeader({ title, actionLabel, onAction }: OverviewSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 min-h-6">
      <h2 className={overviewTypography.sectionLabel}>{title}</h2>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className={overviewTypography.sectionLink}>
          {actionLabel} <span className="text-base leading-none">›</span>
        </button>
      )}
    </div>
  )
}
