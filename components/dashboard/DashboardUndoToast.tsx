'use client'

type DashboardUndoToastProps = {
  title: string
  subtitle: string
  actionLabel: string
  onAction: () => void
}

export default function DashboardUndoToast({
  title,
  subtitle,
  actionLabel,
  onAction,
}: DashboardUndoToastProps) {
  return (
    <div className="absolute bottom-24 left-4 right-24 z-50">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#142952] px-4 py-3 text-white shadow-[0_14px_30px_rgba(20,41,82,0.22)]">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-white/70">{subtitle}</p>
        </div>

        <button
          onClick={onAction}
          className="shrink-0 rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}
