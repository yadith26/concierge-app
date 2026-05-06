'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getPestTargetKey, getVisitTypeKey } from '@/lib/tasks/taskLabels'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'

type ManagerTreatmentFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  pestFilter: 'all' | PestTarget
  onPestFilterChange: (value: 'all' | PestTarget) => void
  visitFilter: 'all' | TreatmentVisitType
  onVisitFilterChange: (value: 'all' | TreatmentVisitType) => void
}

export default function ManagerTreatmentFilters({
  search,
  onSearchChange,
  pestFilter,
  onPestFilterChange,
  visitFilter,
  onVisitFilterChange,
}: ManagerTreatmentFiltersProps) {
  const t = useTranslations('treatmentsFilters')
  const labelT = useTranslations('taskLabels')

  const pestOptions: { value: 'all' | PestTarget; label: string }[] = [
    { value: 'all', label: t('filters.allPests') },
    { value: 'cucarachas', label: labelT(getPestTargetKey('cucarachas')) },
    { value: 'roedores', label: labelT(getPestTargetKey('roedores')) },
    { value: 'chinches', label: labelT(getPestTargetKey('chinches')) },
  ]

  const visitOptions: { value: 'all' | TreatmentVisitType; label: string }[] = [
    { value: 'all', label: t('filters.allVisits') },
    { value: 'nuevo', label: labelT(getVisitTypeKey('nuevo')) },
    { value: 'seguimiento', label: labelT(getVisitTypeKey('seguimiento')) },
    { value: 'preventivo', label: labelT(getVisitTypeKey('preventivo')) },
  ]

  return (
    <div className="rounded-[24px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-4 py-3">
          <Search size={18} className="text-[#8C9AB3]" />
          <input
            type="text"
            placeholder={t('searchPlaceholderHistory')}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full bg-transparent text-[15px] text-[#142952] outline-none placeholder:text-[#8C9AB3]"
          />
        </div>

        <div className="mt-3 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {pestOptions.map((option) => (
              <RecordsChip
                key={option.value}
                label={option.label}
                active={pestFilter === option.value}
                onClick={() => onPestFilterChange(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="mt-2 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {visitOptions.map((option) => (
              <RecordsChip
                key={option.value}
                label={option.label}
                active={visitFilter === option.value}
                onClick={() => onVisitFilterChange(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RecordsChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition ${
        active
          ? 'border border-[#DCE7F5] bg-[#EEF4FF] text-[#2F66C8]'
          : 'border border-[#E7EDF5] bg-white text-[#5E6E8C] hover:bg-[#F8FAFE]'
      }`}
    >
      {label}
    </button>
  )
}
