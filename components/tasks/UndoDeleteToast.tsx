'use client'

import { useTranslations } from 'next-intl'

type UndoDeleteToastProps = {
  taskTitle: string
  onUndo: () => void
  title?: string
  actionLabel?: string
}

export default function UndoDeleteToast({
  taskTitle,
  onUndo,
  title,
  actionLabel,
}: UndoDeleteToastProps) {
  const t = useTranslations('undoDeleteToast')

  return (
    <div className="absolute bottom-24 left-4 right-4 z-50">
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#142952] px-4 py-3 text-white shadow-[0_14px_30px_rgba(20,41,82,0.22)]">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {title || t('deleted')}
          </p>
          <p className="truncate text-xs text-white/70">
            {taskTitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          {actionLabel || t('undo')}
        </button>
      </div>
    </div>
  )
}
