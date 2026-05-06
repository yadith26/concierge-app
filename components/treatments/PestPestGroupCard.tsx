'use client'

import { useLocale, useTranslations } from 'next-intl'
import WarrantyBadge from '@/components/treatments/WarrantyBadge'
import {
  formatDateLong,
  formatDateLong as formatDateShort,
} from '@/lib/tasks/taskLabels'
import {
  getPestTargetKey,
  getVisitTypeKey,
} from '@/lib/tasks/taskLabels'
import type { PestGroupSummary } from '@/lib/tasks/pestHistoryHelpers'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'
import {
  Bug,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  Shield,
} from 'lucide-react'

type PestPestGroupCardProps = {
  apartment: string
  pestGroup: PestGroupSummary<any>
  expandedPestKey: string | null
  setExpandedPestKey: React.Dispatch<React.SetStateAction<string | null>>
  onDeleteHistoryRecord: (id: string) => void
}

export default function PestPestGroupCard({
  apartment,
  pestGroup,
  expandedPestKey,
  setExpandedPestKey,
  onDeleteHistoryRecord,
}: PestPestGroupCardProps) {
  const t = useTranslations('taskLabels')
  const uiT = useTranslations('pestGroupCard')
  const locale = useLocale()

  const pestKey = `${apartment}-${pestGroup.pestTarget}`
  const expandedPest = expandedPestKey === pestKey

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#E7EDF5] bg-[#F9FBFE]">
      <button
        type="button"
        onClick={() =>
          setExpandedPestKey((prev) => (prev === pestKey ? null : pestKey))
        }
        className="block w-full text-left"
      >
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge type={pestGroup.pestTarget} t={t} />

              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5E6E8C]">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDateShort(pestGroup.latestDate, locale)}
              </span>

              {pestGroup.warranty && (
                <WarrantyBadge
                  isActive={pestGroup.warranty.isActive}
                  endDate={pestGroup.warranty.endDate}
                />
              )}
            </div>

            <p className="mt-2 text-sm text-[#7B8BA8]">
              {pestGroup.totalTreatments}{' '}
              {uiT('times', { count: pestGroup.totalTreatments })}
            </p>
          </div>

          <div className="p-3">
            {expandedPest ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          expandedPest ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#EEF3F8] px-4 py-4">
            <div className="space-y-3">
              {pestGroup.history.map((item, index) => {
                const isLast = index === pestGroup.history.length - 1

                return (
                  <div
                    key={item.id}
                    className="flex items-stretch gap-3 rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4"
                  >
                    <div className="flex w-5 flex-col items-center">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#2F66C8]" />
                      {!isLast && (
                        <div className="mt-1 w-[2px] flex-1 bg-[#DCE7F5]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <VisitBadge type={item.treatment_visit_type} t={t} />

                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F6FA] px-2.5 py-1 text-xs font-semibold text-[#5E6E8C]">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDateLong(item.treatment_date, locale)}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            <DetailRow
                              icon={<Shield className="h-4 w-4" />}
                              label={uiT('visitType')}
                              value={t(getVisitTypeKey(item.treatment_visit_type))}
                            />

                            <DetailRow
                              icon={<FileText className="h-4 w-4" />}
                              label={uiT('note')}
                              value={item.notes?.trim() || uiT('noNote')}
                            />

                            <DetailRow
                              icon={<Clock3 className="h-4 w-4" />}
                              label={uiT('createdAt')}
                              value={new Date(item.created_at).toLocaleString(locale)}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteHistoryRecord(item.id)}
                          className="text-xs font-semibold text-[#D64555]"
                        >
                          {uiT('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypeBadge({ type, t }: { type: PestTarget; t: any }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-[#F4F6FA]">
      <Bug className="h-3.5 w-3.5" />
      {t(getPestTargetKey(type))}
    </span>
  )
}

function VisitBadge({
  type,
  t,
}: {
  type: TreatmentVisitType | null
  t: any
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-[#F4F6FA]">
      <Shield className="h-3.5 w-3.5" />
      {t(getVisitTypeKey(type ?? 'nuevo'))}
    </span>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#F9FBFE] px-4 py-3">
      <div className="mt-0.5 text-[#7B8BA8]">{icon}</div>
      <div>
        <p className="text-xs font-medium text-[#8C9AB3]">{label}</p>
        <p className="text-sm font-medium text-[#142952]">{value}</p>
      </div>
    </div>
  )
}