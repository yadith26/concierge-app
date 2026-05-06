'use client'

import PestApartmentCard from '@/components/treatments/PestApartmentCard'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'
import type { ApartmentHistorySummary } from '@/lib/tasks/pestHistoryHelpers'

type PestHistorySectionProps = {
  groupedTreatments: ApartmentHistorySummary<{
    id: string
    apartment_or_area: string
    apartment_key?: string | null
    pest_target: PestTarget | null
    treatment_visit_type: TreatmentVisitType | null
    treatment_date: string
    notes: string | null
    created_at: string
  }>[]
  expandedApartment: string | null
  expandedPestKey: string | null
  setExpandedApartment: React.Dispatch<React.SetStateAction<string | null>>
  setExpandedPestKey: React.Dispatch<React.SetStateAction<string | null>>
  onDeleteHistoryRecord: (id: string) => void
}

export default function PestHistorySection({
  groupedTreatments,
  expandedApartment,
  expandedPestKey,
  setExpandedApartment,
  setExpandedPestKey,
  onDeleteHistoryRecord,
}: PestHistorySectionProps) {
  return (
    <div className="space-y-3">
      {groupedTreatments.map((group) => (
        <PestApartmentCard
          key={group.apartment}
          group={group}
          expandedApartment={expandedApartment}
          expandedPestKey={expandedPestKey}
          setExpandedApartment={setExpandedApartment}
          setExpandedPestKey={setExpandedPestKey}
          onDeleteHistoryRecord={onDeleteHistoryRecord}
        />
      ))}
    </div>
  )
}