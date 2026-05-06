'use client'

import { Search, Filter } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getPestTargetKey, getVisitTypeKey } from '@/lib/tasks/taskLabels'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'

type TreatmentsTab = 'scheduled' | 'history'

type TreatmentsFiltersProps = {
  activeTab: TreatmentsTab
  setActiveTab: (tab: TreatmentsTab) => void
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  pestFilter: 'all' | PestTarget
  setPestFilter: React.Dispatch<React.SetStateAction<'all' | PestTarget>>
  visitFilter: 'all' | TreatmentVisitType
  setVisitFilter: React.Dispatch<
    React.SetStateAction<'all' | TreatmentVisitType>
  >
}

const pestOptions: { value: 'all' | PestTarget; key: string }[] = [
  { value: 'all', key: 'all' },
  { value: 'cucarachas', key: 'cucarachas' },
  { value: 'roedores', key: 'roedores' },
  { value: 'chinches', key: 'chinches' },
]

const visitOptions: { value: 'all' | TreatmentVisitType; key: string }[] = [
  { value: 'all', key: 'all' },
  { value: 'nuevo', key: 'nuevo' },
  { value: 'seguimiento', key: 'seguimiento' },
  { value: 'preventivo', key: 'preventivo' },
]

export default function TreatmentsFilters({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  pestFilter,
  setPestFilter,
  visitFilter,
  setVisitFilter,
}: TreatmentsFiltersProps) {
  const t = useTranslations('treatmentsFilters')
  const labelT = useTranslations('taskLabels')

  return (
    <div className="rounded-[24px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-2 rounded-[20px] bg-[#F5F8FF] p-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('scheduled')}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'scheduled'
                ? 'bg-[#2F66C8] text-white shadow-[0_8px_18px_rgba(47,102,200,0.24)]'
                : 'text-[#5E6E8C] hover:bg-white'
            }`}
          >
            {t('tabs.scheduled')}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-[#2F66C8] text-white shadow-[0_8px_18px_rgba(47,102,200,0.24)]'
                : 'text-[#5E6E8C] hover:bg-white'
            }`}
          >
            {t('tabs.history')}
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-4 py-3">
          <Search size={18} className="text-[#8C9AB3]" />
          <input
            type="text"
            placeholder={
              activeTab === 'scheduled'
                ? t('searchPlaceholderScheduled')
                : t('searchPlaceholderHistory')
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-[15px] text-[#142952] outline-none placeholder:text-[#8C9AB3]"
          />
        </div>

        <div className="mt-3 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {pestOptions.map((option) => (
              <TreatmentFilterChip
                key={option.value}
                label={
                  option.value === 'all'
                    ? t('filters.allPests')
                    : labelT(getPestTargetKey(option.value))
                }
                active={pestFilter === option.value}
                onClick={() => setPestFilter(option.value)}
                icon={
                  option.value === 'all' ? (
                    <Filter className="h-4 w-4" />
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>

        <div className="mt-2 overflow-x-auto">
          <div className="flex min-w-max gap-2">
            {visitOptions.map((option) => (
              <TreatmentFilterChip
                key={option.value}
                label={
                  option.value === 'all'
                    ? t('filters.allVisits')
                    : labelT(getVisitTypeKey(option.value))
                }
                active={visitFilter === option.value}
                onClick={() => setVisitFilter(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TreatmentFilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
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
      {icon}
      {label}
    </button>
  )
}
