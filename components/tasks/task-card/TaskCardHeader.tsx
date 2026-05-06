'use client'

import type { ComponentType } from 'react'
import {
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Clock3,
} from 'lucide-react'

type TaskCardHeaderProps = {
  title: string
  categoryLabel: string
  CategoryIcon: ComponentType<{ className?: string }>
  categoryChip: string
  isUrgent: boolean
  isFromManagerEvent?: boolean
  soonLabel: string | null
  statusLabel: string
  badgeClass: string
  expanded: boolean
  apartmentSummary: string | null
  description?: string | null
  compact?: boolean
  hideSecondaryChips?: boolean
  hideTopChips?: boolean
}

export default function TaskCardHeader({
  title,
  categoryLabel,
  CategoryIcon,
  categoryChip,
  isUrgent,
  isFromManagerEvent = false,
  soonLabel,
  statusLabel,
  badgeClass,
  expanded,
  apartmentSummary,
  description,
  compact = false,
  hideSecondaryChips = false,
  hideTopChips = false,
}: TaskCardHeaderProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {!hideTopChips ? (
            <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${categoryChip} ${
                  compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
                }`}
              >
                <CategoryIcon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                {categoryLabel}
              </span>

              {isUrgent && !hideSecondaryChips && (
                <span className={`inline-flex items-center gap-1 rounded-full bg-[#FFF4F5] font-semibold text-[#D64555] ${
                  compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
                }`}>
                  <CircleAlert className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                  Urgente
                </span>
              )}

              {isFromManagerEvent && !hideSecondaryChips && (
                <span className={`inline-flex items-center gap-1 rounded-full bg-[#FFF7D6] font-semibold text-[#B7791F] ${
                  compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
                }`}>
                  Evento manager
                </span>
              )}

              {soonLabel && !hideSecondaryChips && (
                <span className={`inline-flex items-center gap-1 rounded-full bg-[#FFF4E8] font-semibold text-[#C65A17] ${
                  compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
                }`}>
                  <Clock3 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                  {soonLabel}
                </span>
              )}
            </div>
          ) : (
            <p className="pt-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A92B2]">
              {categoryLabel}
            </p>
          )}
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1.5">
          <span
            className={`inline-flex items-center font-semibold ${badgeClass} ${
              compact ? 'rounded-full px-2.5 py-0.5 text-[11px]' : 'rounded-[16px] px-3 py-1 text-xs'
            }`}
          >
            {statusLabel}
          </span>

          <div className={`border border-[#E3EAF3] bg-white text-[#6E7F9D] shadow-[0_4px_12px_rgba(20,41,82,0.04)] ${
            compact ? 'rounded-[14px] p-1.5' : 'rounded-[16px] p-2'
          }`}>
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </div>
        </div>
      </div>

      <h3 className={`break-words font-bold leading-tight tracking-tight text-[#142952] ${
        compact ? `${hideTopChips ? 'mt-0.5' : 'mt-2'} text-[17px]` : 'mt-2.5 text-[19px]'
      }`}>
        {title}
      </h3>

      {apartmentSummary && (
        <p className={`font-medium text-[#5E6E8C] ${compact ? 'mt-1.5 text-[14px]' : 'mt-2 text-[15px]'}`}>
          {apartmentSummary}
        </p>
      )}

      {!expanded && description && !compact && (
        <p className={`line-clamp-2 text-[#7B8BA8] ${compact ? 'mt-1 text-[13px]' : 'mt-1.5 text-sm'}`}>
          {description}
        </p>
      )}
    </div>
  )
}
