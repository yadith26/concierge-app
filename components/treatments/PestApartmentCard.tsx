'use client'

import { useLocale, useTranslations } from 'next-intl'
import WarrantyBadge from '@/components/treatments/WarrantyBadge'
import PestPestGroupCard from '@/components/treatments/PestPestGroupCard'
import {
  getPestTargetKey,
  getVisitTypeKey,
  formatDateLong,
} from '@/lib/tasks/taskLabels'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'
import type { ApartmentHistorySummary } from '@/lib/tasks/pestHistoryHelpers'
import { Bug, ChevronDown, ChevronUp, Shield } from 'lucide-react'

type PestApartmentCardProps = {
  group: ApartmentHistorySummary<{
    id: string
    apartment_or_area: string
    apartment_key?: string | null
    pest_target: PestTarget | null
    treatment_visit_type: TreatmentVisitType | null
    treatment_date: string
    notes: string | null
    created_at: string
  }>
  expandedApartment: string | null
  expandedPestKey: string | null
  setExpandedApartment: React.Dispatch<React.SetStateAction<string | null>>
  setExpandedPestKey: React.Dispatch<React.SetStateAction<string | null>>
  onDeleteHistoryRecord: (id: string) => void
}

export default function PestApartmentCard({
  group,
  expandedApartment,
  expandedPestKey,
  setExpandedApartment,
  setExpandedPestKey,
  onDeleteHistoryRecord,
}: PestApartmentCardProps) {
  const t = useTranslations('taskLabels')
  const uiT = useTranslations('pestApartmentCard')
  const locale = useLocale()

  const expandedApartmentCard = expandedApartment === group.apartment

  return (
    <div className="overflow-hidden rounded-[26px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <button
        type="button"
        onClick={() =>
          setExpandedApartment((prev) =>
            prev === group.apartment ? null : group.apartment
          )
        }
        className="block w-full text-left"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF3E8] px-2.5 py-1 text-xs font-semibold text-[#AD6A00]">
                <Shield className="h-3.5 w-3.5" />
                {uiT('history')}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <h3 className="truncate text-[20px] font-bold tracking-tight text-[#142952]">
                {group.apartment}
              </h3>

              {!expandedApartmentCard && (
                <div className="flex shrink-0 items-center gap-2">
                  {group.summary.activeWarranty && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-[#22A06B]"
                      title={uiT('activeWarranty')}
                    />
                  )}

                  {group.summary.hasRecurrentProblem && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-[#D64555]"
                      title={uiT('recurrentProblem')}
                    />
                  )}

                  <span className="text-sm font-medium text-[#7B8BA8]">
                    {group.totalTreatments} {uiT('visits', {count: group.totalTreatments})}
                  </span>
                </div>
              )}
            </div>

            {expandedApartmentCard && (
              <>
                <div className="mt-3 space-y-1.5 text-sm">
                  <p className="text-[#5E6E8C]">
                    {uiT('latest')}:{' '}
                    <span className="font-semibold text-[#142952]">
                      {group.summary.latestPestTarget
                        ? t(getPestTargetKey(group.summary.latestPestTarget))
                        : uiT('unspecified')}
                    </span>
                    {group.summary.latestVisitType && (
                      <span className="text-[#7B8BA8]">
                        {' '}
                        ({t(getVisitTypeKey(group.summary.latestVisitType))})
                      </span>
                    )}
                  </p>

                  <p className="text-[#5E6E8C]">
                    {uiT('total')}:{' '}
                    <span className="font-semibold text-[#142952]">
                      {group.totalTreatments} {uiT('visits', {count: group.totalTreatments})}
                    </span>
                  </p>

                  {group.summary.activeWarranty && (
                    <p className="font-medium text-[#177B52]">
                      {uiT('activeUntil')}{' '}
                      {formatDateLong(group.summary.activeWarranty.endDate, locale)}
                    </p>
                  )}
                </div>

                {group.summary.hasRecurrentProblem && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[#C93A4B]">
                      ! {uiT('recurrentProblem')}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {group.pestGroups.map((pestGroup) => (
                    <span
                      key={pestGroup.pestTarget}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F6FA] px-2.5 py-1 text-xs font-semibold text-[#5E6E8C]"
                    >
                      <Bug className="h-3.5 w-3.5" />
                      {t(getPestTargetKey(pestGroup.pestTarget))} (
                      {pestGroup.totalTreatments})
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-3">
            {expandedApartmentCard ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </button>

      <div
        className={`grid transition-all duration-300 ${
          expandedApartmentCard ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#EEF3F8] px-5 py-5">
            <div className="space-y-3">
              {group.pestGroups.map((pestGroup) => (
                <PestPestGroupCard
                  key={pestGroup.pestTarget}
                  apartment={group.apartment}
                  pestGroup={pestGroup}
                  expandedPestKey={expandedPestKey}
                  setExpandedPestKey={setExpandedPestKey}
                  onDeleteHistoryRecord={onDeleteHistoryRecord}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}