'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { formatDateLong, getPestTargetKey, getVisitTypeKey } from '@/lib/tasks/taskLabels'
import { buildGroupedTreatments } from '@/lib/tasks/pestHistoryHelpers'

type TFunction = (
  key: string,
  values?: Record<string, string | number | Date>
) => string

type ManagerTreatmentCardProps = {
  group: ReturnType<typeof buildGroupedTreatments>[number]
  locale: string
  t: TFunction
  expanded: boolean
  onToggle: () => void
}

export default function ManagerTreatmentCard({
  group,
  locale,
  t,
  expanded,
  onToggle,
}: ManagerTreatmentCardProps) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="block w-full text-left"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-[20px] font-bold tracking-tight text-[#142952]">
                {group.apartment}
              </h3>

              <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#7B8BA8]">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22A06B]" />
                {group.totalTreatments}{' '}
                {group.totalTreatments === 1 ? 'visit' : 'visits'}
              </div>
            </div>
          </div>

          <div className="p-3 text-[#5E6E8C]">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#EEF3F8] px-5 py-5">
            <div className="space-y-3">
              {group.pestGroups.map((pestGroup) => (
                <div
                  key={pestGroup.pestTarget}
                  className="rounded-[22px] border border-[#E7EDF5] bg-[#F9FBFE] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5E6E8C]">
                      {t(`taskLabels.${getPestTargetKey(pestGroup.pestTarget)}`)}
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#5E6E8C]">
                      {formatDateLong(pestGroup.latestDate, locale)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {pestGroup.history.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[#E7EDF5] bg-white px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          {item.treatment_visit_type ? (
                            <span className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#2F66C8]">
                              {t(
                                `taskLabels.${getVisitTypeKey(
                                  item.treatment_visit_type
                                )}`
                              )}
                            </span>
                          ) : null}
                          <span className="text-sm font-medium text-[#5E6E8C]">
                            {formatDateLong(item.treatment_date, locale)}
                          </span>
                        </div>

                        {item.notes?.trim() ? (
                          <p className="mt-2 text-sm leading-6 text-[#5E6E8C]">
                            {item.notes}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
