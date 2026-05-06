'use client'

import { buildGroupedTreatments } from '@/lib/tasks/pestHistoryHelpers'
import ManagerRecordsEmptyState from '@/components/manager/records/ManagerRecordsEmptyState'
import ManagerTreatmentCard from '@/components/manager/records/ManagerTreatmentCard'

type TFunction = (
  key: string,
  values?: Record<string, string | number | Date>
) => string

type ManagerRecordsTreatmentContentProps = {
  groupedTreatments: ReturnType<typeof buildGroupedTreatments>
  expandedApartment: string | null
  locale: string
  t: TFunction
  onToggleApartment: (apartment: string) => void
}

export default function ManagerRecordsTreatmentContent({
  groupedTreatments,
  expandedApartment,
  locale,
  t,
  onToggleApartment,
}: ManagerRecordsTreatmentContentProps) {
  return groupedTreatments.length > 0 ? (
    <div className="space-y-3">
      {groupedTreatments.map((group) => (
        <ManagerTreatmentCard
          key={group.apartment}
          group={group}
          locale={locale}
          t={t}
          expanded={expandedApartment === group.apartment}
          onToggle={() => onToggleApartment(group.apartment)}
        />
      ))}
    </div>
  ) : (
    <ManagerRecordsEmptyState
      title="No treatments"
      description="No treatment records match the current filters."
    />
  )
}
