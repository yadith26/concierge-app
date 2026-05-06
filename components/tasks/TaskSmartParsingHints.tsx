'use client'

import { WandSparkles, Zap } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import {
  formatDateLong,
  getSmartCategoryKey,
  getSmartPriorityKey,
} from '@/lib/tasks/taskLabels'
import type { TaskCategory, TaskPriority } from '@/lib/tasks/taskTypes'

type SmartParsedData = {
  detectedCategory?: TaskCategory | null
  detectedPriority?: TaskPriority | null
  detectedDate?: string | null
  detectedTime?: string | null
  detectedLocation?: string | null
  cleanedTitle?: string | null
  shouldAutoSubmit?: boolean
}

type TaskSmartParsingHintsProps = {
  title: string
  category: TaskCategory | ''
  smartParsed: SmartParsedData
  onUseCleanTitle: (value: string) => void
}

export default function TaskSmartParsingHints({
  title,
  category,
  smartParsed,
  onUseCleanTitle,
}: TaskSmartParsingHintsProps) {
  const t = useTranslations('taskSmartParsingHints')
  const labelT = useTranslations('taskLabels')
  const locale = useLocale()

  if (!title.trim()) return null

  const cleanTitle = smartParsed.cleanedTitle?.trim()

  const hasDetectedValues =
    !!smartParsed.detectedCategory ||
    !!smartParsed.detectedPriority ||
    !!smartParsed.detectedDate ||
    !!smartParsed.detectedTime ||
    !!smartParsed.detectedLocation

  const showCleanTitleButton = !!cleanTitle && cleanTitle !== title.trim()

  if (!hasDetectedValues && !showCleanTitleButton) return null

  return (
    <div className="mt-3 space-y-3">
      {hasDetectedValues && (
        <div className="rounded-2xl border border-[#DCE7F5] bg-[#F7FAFF] px-4 py-3 text-sm text-[#4E6285]">
          <div className="flex items-center gap-2 font-semibold text-[#2F66C8]">
            <WandSparkles className="h-4 w-4" />
            {t('detectedAutomatically')}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {smartParsed.detectedCategory && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2F66C8]">
                {labelT(getSmartCategoryKey(smartParsed.detectedCategory))}
              </span>
            )}

            {smartParsed.detectedPriority && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2F66C8]">
                {t('priority')} {labelT(getSmartPriorityKey(smartParsed.detectedPriority))}
              </span>
            )}

            {smartParsed.detectedDate && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2F66C8]">
                {formatDateLong(smartParsed.detectedDate, locale)}
              </span>
            )}

            {smartParsed.detectedTime && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2F66C8]">
                {smartParsed.detectedTime}
              </span>
            )}

            {smartParsed.detectedLocation && category !== 'pest' && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2F66C8]">
                {smartParsed.detectedLocation}
              </span>
            )}

            {smartParsed.detectedLocation && category === 'pest' && (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#B86A22]">
                {t('apartmentAddedAutomatically')}
              </span>
            )}
          </div>

          {smartParsed.shouldAutoSubmit && (
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#177B52]">
              <Zap className="h-4 w-4" />
              {t('pressEnterToSave')}
            </p>
          )}
        </div>
      )}

      {showCleanTitleButton && cleanTitle && (
        <button
          type="button"
          onClick={() => onUseCleanTitle(cleanTitle)}
          className="inline-flex items-center gap-2 rounded-full border border-[#DCE7F5] bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2F66C8] transition hover:bg-[#E4EEFF]"
        >
          <WandSparkles className="h-4 w-4" />
          {t('useCleanTitle')}
        </button>
      )}
    </div>
  )
}
