'use client'

import type { ReactNode } from 'react'
import { Building2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getLocalDateInputValue } from '@/lib/dates/localDate'
import type { TaskCategory } from '@/lib/tasks/taskTypes'
import StyledDropdown from '@/components/ui/StyledDropdown'
import { getEventCategories } from '@/lib/agenda/managerAgendaEventHelpers'
type ManagerAgendaEventModalProps = {
  open: boolean
  title: string
  date: string
  buildingId?: string
  buildingOptions?: { id: string; name: string; address?: string | null }[]
  location: string
  category: TaskCategory | ''
  notes: string
  saving: boolean
  onClose: () => void
  onChangeTitle: (value: string) => void
  onChangeDate: (value: string) => void
  onChangeBuilding?: (value: string) => void
  onChangeLocation: (value: string) => void
  onChangeCategory: (value: TaskCategory | '') => void
  onChangeNotes: (value: string) => void
  onSubmit: () => void
}

export default function ManagerAgendaEventModal({
  open,
  title,
  date,
  buildingId = '',
  buildingOptions = [],
  location,
  category,
  notes,
  saving,
  onClose,
  onChangeTitle,
  onChangeDate,
  onChangeBuilding,
  onChangeLocation,
  onChangeCategory,
  onChangeNotes,
  onSubmit,
}: ManagerAgendaEventModalProps) {
  const t = useTranslations('managerAgenda')
  const eventCategories = getEventCategories(t)
  const buildingDropdownOptions = buildingOptions.map((building) => ({
    value: building.id,
    label: building.address ? `${building.name} - ${building.address}` : building.name,
    icon: <Building2 size={18} />,
  }))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#142952]/35 px-4 py-8">
      <div className="w-full max-w-md rounded-[30px] bg-white p-5 shadow-[0_24px_48px_rgba(20,41,82,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#142952]">
              {t('newEvent')}
            </h3>
            <p className="mt-1 text-sm text-[#6E7F9D]">
              {t('eventHint')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#F3F6FB] p-2 text-[#6E7F9D]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Field label={t('title')}>
            <input
              value={title}
              onChange={(event) => onChangeTitle(event.target.value)}
              className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 text-[#142952] outline-none focus:border-[#2F66C8]"
              placeholder={t('titlePlaceholder')}
            />
          </Field>

          <Field label={t('dateLabel')}>
            <input
              type="date"
              value={date}
              min={getLocalDateInputValue()}
              onChange={(event) => onChangeDate(event.target.value)}
              className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 text-[#142952] outline-none focus:border-[#2F66C8]"
            />
          </Field>

          {onChangeBuilding && buildingDropdownOptions.length > 0 ? (
            <Field label={t('building')}>
              <StyledDropdown
                ariaLabel={t('building')}
                value={buildingId}
                options={buildingDropdownOptions}
                onChange={onChangeBuilding}
                placeholder={t('selectBuilding')}
                buttonClassName="h-14 border-[#D9E0EA] py-0"
                zIndexClassName="z-50"
              />
            </Field>
          ) : null}

          <Field label={t('category')}>
            <StyledDropdown
              ariaLabel={t('category')}
              value={category}
              options={eventCategories}
              onChange={(value) => onChangeCategory(value as TaskCategory)}
              placeholder={t('selectCategory')}
              buttonClassName="h-14 border-[#D9E0EA] py-0"
            />
          </Field>

          <Field label={t('location')}>
            <input
              value={location}
              onChange={(event) => onChangeLocation(event.target.value)}
              className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 text-[#142952] outline-none focus:border-[#2F66C8]"
              placeholder={t('locationPlaceholder')}
            />
          </Field>

          <Field label={t('note')}>
            <textarea
              value={notes}
              onChange={(event) => onChangeNotes(event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-[#D9E0EA] px-4 py-3 text-[#142952] outline-none focus:border-[#2F66C8]"
              placeholder={t('notePlaceholder')}
            />
          </Field>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-[#D9E0EA] px-4 py-3 text-sm font-semibold text-[#6E7F9D]"
          >
            {t('cancel')}
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 rounded-2xl bg-[#2F66C8] px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {saving ? t('saving') : t('createEvent')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
        {label}
      </span>
      {children}
    </label>
  )
}
