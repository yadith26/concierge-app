'use client'

import {
  Building2,
  Camera,
  Clock3,
  Layers3,
  NotebookPen,
  Shield,
} from 'lucide-react'

type TaskCardMetaProps = {
  dateLabel: string
  priorityLabel: string
  taskTime?: string | null
  hasPhotos: boolean
  photoCount: number
  hasNote: boolean
  isPest: boolean
  pestCount: number
  apartmentCount: number
  showVisitTypeChip: boolean
  visitTypeLabel?: string | null
  initialCount: number
  followUpCount: number
  preventiveCount: number
  compact?: boolean
  minimal?: boolean
}

export default function TaskCardMeta({
  dateLabel,
  priorityLabel,
  taskTime,
  hasPhotos,
  photoCount,
  hasNote,
  isPest,
  pestCount,
  apartmentCount,
  showVisitTypeChip,
  visitTypeLabel,
  initialCount,
  followUpCount,
  preventiveCount,
  compact = false,
  minimal = false,
}: TaskCardMetaProps) {
  return (
    <>
      <div className={`flex flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
        <span className={`${compact ? 'text-[13px]' : 'text-sm'} text-[#7B8BA8]`}>
          {dateLabel}
          <span className="px-1 text-[#C8D3E1]">•</span>
          {priorityLabel}
        </span>

        {taskTime && !minimal && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] font-semibold text-[#2F66C8] ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Clock3 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {taskTime.slice(0, 5)}
          </span>
        )}

        {hasPhotos && !minimal && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] font-semibold text-[#2F66C8] ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Camera className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {photoCount}
          </span>
        )}

        {hasNote && !minimal && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#F4F6FA] font-semibold text-[#5E6E8C] ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <NotebookPen className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            Nota
          </span>
        )}

        {isPest && pestCount > 0 && !minimal && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#FFF3E8] font-semibold text-[#AD6A00] ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Layers3 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {pestCount} plaga{pestCount === 1 ? '' : 's'}
          </span>
        )}

        {isPest && apartmentCount > 0 && !minimal && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] font-semibold text-[#2F66C8] ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Building2 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {apartmentCount} apto{apartmentCount === 1 ? '' : 's'}
          </span>
        )}

        {showVisitTypeChip && visitTypeLabel && !minimal && (
          <span className={`inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] font-semibold text-[#2F66C8] ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          }`}>
            <Shield className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            {visitTypeLabel}
          </span>
        )}
      </div>

      {isPest && apartmentCount > 0 && !minimal && (
        <div className="mt-2 flex flex-wrap gap-2">
          {initialCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#2F66C8]">
              <Shield className="h-3.5 w-3.5" />
              {initialCount} inicial{initialCount === 1 ? '' : 'es'}
            </span>
          )}

          {followUpCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F3EEFF] px-2.5 py-1 text-xs font-semibold text-[#7A5AC7]">
              <Shield className="h-3.5 w-3.5" />
              {followUpCount} seguimiento{followUpCount === 1 ? '' : 's'}
            </span>
          )}

          {preventiveCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF7F0] px-2.5 py-1 text-xs font-semibold text-[#177B52]">
              <Shield className="h-3.5 w-3.5" />
              {preventiveCount} preventivo{preventiveCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}
    </>
  )
}
