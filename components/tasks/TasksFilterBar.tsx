'use client'

import { useMemo, type ReactNode, type RefObject } from 'react'
import {
  Search,
  ClipboardList,
  ChevronDown,
  Download,
  Sparkles,
  Wrench,
  Bug,
  Paintbrush,
  ClipboardCheck,
  Users,
  Package,
  Repeat,
  Check,
  Tag,
  SlidersHorizontal,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { CategoryFilter, StatusFilter } from '@/lib/tasks/taskPageTypes'

type TasksFilterBarProps = {
  search: string
  onSearchChange: (value: string) => void
  categoryFilter: CategoryFilter
  onCategoryChange: (value: CategoryFilter) => void
  statusFilter: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  categoryOpen: boolean
  onToggleCategory: () => void
  onCloseCategory: () => void
  categoryRef: RefObject<HTMLDivElement | null>
  counts: {
    overdueCount: number
    totalCount: number
    urgentCount: number
    pendingCount: number
    inProgressCount: number
    completedCount: number
  }
  onExport: () => void
}

type CategoryOption = {
  value: CategoryFilter
  label: string
  icon: ReactNode
}

export default function TasksFilterBar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  categoryOpen,
  onToggleCategory,
  onCloseCategory,
  categoryRef,
  counts,
  onExport,
}: TasksFilterBarProps) {
  const t = useTranslations('tasksFilterBar')
  const labelT = useTranslations('taskLabels')

  const categoryOptions: CategoryOption[] = useMemo(
    () => [
      { value: 'all', label: t('allCategories'), icon: <ClipboardList className="h-4 w-4" /> },
      { value: 'cleaning', label: labelT('category.cleaning'), icon: <Sparkles className="h-4 w-4" /> },
      { value: 'repair', label: labelT('category.repair'), icon: <Wrench className="h-4 w-4" /> },
      { value: 'pest', label: labelT('category.pest'), icon: <Bug className="h-4 w-4" /> },
      { value: 'paint', label: labelT('category.paint'), icon: <Paintbrush className="h-4 w-4" /> },
      { value: 'visit', label: labelT('category.visit'), icon: <Users className="h-4 w-4" /> },
      { value: 'change', label: labelT('category.change'), icon: <Repeat className="h-4 w-4" /> },
      { value: 'inspection', label: labelT('category.inspection'), icon: <ClipboardCheck className="h-4 w-4" /> },
      { value: 'delivery', label: labelT('category.delivery'), icon: <Package className="h-4 w-4" /> },
      { value: 'other', label: labelT('category.other'), icon: <Tag className="h-4 w-4" /> },
    ],
    [labelT, t]
  )

  const selectedCategory =
    categoryOptions.find((option) => option.value === categoryFilter) ||
    categoryOptions[0]

  return (
    <div className="relative z-20 rounded-[22px] border border-[#E7EDF5] bg-white shadow-[0_6px_18px_rgba(20,41,82,0.04)]">
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[15px] border border-[#E7EDF5] bg-[#F9FBFE] px-3">
            <Search size={18} className="shrink-0 text-[#8C9AB3]" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full min-w-0 bg-transparent text-sm text-[#142952] outline-none placeholder:text-[#8C9AB3]"
            />
          </div>

          <div className="relative shrink-0" ref={categoryRef}>
            <button
              type="button"
              onClick={onToggleCategory}
              className="flex h-11 items-center gap-2 rounded-[15px] border border-[#E7EDF5] bg-[#F9FBFE] px-3 text-sm font-medium text-[#142952]"
            >
              <SlidersHorizontal size={17} className="text-[#60739A]" />
              <span className="hidden max-w-[130px] truncate min-[390px]:block">
                {selectedCategory.label}
              </span>
              <ChevronDown
                size={16}
                className={`transition ${categoryOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {categoryOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[245px] overflow-hidden rounded-[18px] border border-[#E7EDF5] bg-white shadow-[0_12px_30px_rgba(20,41,82,0.12)]">
                {categoryOptions.map((option) => {
                  const selected = categoryFilter === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onCategoryChange(option.value)
                        onCloseCategory()
                      }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left ${
                        selected ? 'bg-[#F3F7FD]' : 'hover:bg-[#F8FAFE]'
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm font-medium text-[#5E6E8C]">
                        <span className="text-[#60739A]">{option.icon}</span>
                        {option.label}
                      </span>

                      {selected && <Check className="h-4 w-4 text-[#2F66C8]" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex min-w-max gap-2">
            <FilterTab
              label={`${t('all')} (${counts.totalCount})`}
              active={statusFilter === 'all'}
              onClick={() => onStatusChange('all')}
            />
            <FilterTab
              label={`${t('urgent')} (${counts.urgentCount})`}
              active={statusFilter === 'urgent'}
              onClick={() => onStatusChange('urgent')}
            />
            <FilterTab
              label={`${t('overdue')} (${counts.overdueCount})`}
              active={statusFilter === 'overdue'}
              onClick={() => onStatusChange('overdue')}
            />
            <FilterTab
              label={`${t('pending')} (${counts.pendingCount})`}
              active={statusFilter === 'pending'}
              onClick={() => onStatusChange('pending')}
            />
            <FilterTab
              label={`${t('inProgress')} (${counts.inProgressCount})`}
              active={statusFilter === 'in_progress'}
              onClick={() => onStatusChange('in_progress')}
            />
            <FilterTab
              label={`${t('completed')} (${counts.completedCount})`}
              active={statusFilter === 'completed'}
              onClick={() => onStatusChange('completed')}
            />
          </div>
        </div>

        <div className="flex justify-end px-1">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-[#E1E7F0] bg-white px-3.5 text-[13px] font-semibold text-[#4B63DF] shadow-[0_6px_16px_rgba(20,41,82,0.04)] active:scale-[0.97]"
          >
            <Download size={15} />
            {t('export')}
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterTab({
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
      className={`h-9 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
        active
          ? 'border-[#D7E4FF] bg-[#EEF4FF] text-[#3457D5]'
          : 'border-[#E7EDF5] bg-white text-[#60739A] hover:bg-[#F8FAFE]'
      }`}
    >
      {label}
    </button>
  )
}
