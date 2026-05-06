'use client'

import LocationField from '@/components/locations/LocationField'
import { Check, Plus, Trash2 } from 'lucide-react'
import {
  pestTargetOptions,
  visitTypeOptions,
} from '@/lib/tasks/taskFormOptions'
import { useTranslations } from 'next-intl'
import { getVisitTypeKey } from '@/lib/tasks/taskLabels'
import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'
import type { TaskApartmentInput } from '@/lib/tasks/taskApartments'

type TaskPestSectionProps = {
  pestTargets: PestTarget[]
  onTogglePestTarget: (target: PestTarget) => void
  draftApartmentValue: string
  setDraftApartmentValue: (value: string) => void
  draftApartmentVisitType: TreatmentVisitType | ''
  setDraftApartmentVisitType: (value: TreatmentVisitType | '') => void
  sanitizeApartmentValue: (value: string) => string
  selectedApartments: TaskApartmentInput[]
  handleAddApartment: () => { ok: boolean; message?: string }
  handleRemoveApartment: (index: number) => void
  onMessage: (message: string) => void
  currentMessage?: string
  locationFieldKey: string
}

export default function TaskPestSection({
  pestTargets,
  onTogglePestTarget,
  draftApartmentValue,
  setDraftApartmentValue,
  draftApartmentVisitType,
  setDraftApartmentVisitType,
  sanitizeApartmentValue,
  selectedApartments,
  handleAddApartment,
  handleRemoveApartment,
  onMessage,
  currentMessage = '',
  locationFieldKey,
}: TaskPestSectionProps) {
  const t = useTranslations('taskPestSection')
  const labelT = useTranslations('taskLabels')
  const oneApartmentErrorText = t('oneApartmentError')

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {t('pests')}
        </label>

        <div className="grid grid-cols-1 gap-2">
          {pestTargetOptions.map((option) => {
            const selected = pestTargets.includes(option.value)

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onTogglePestTarget(option.value)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? 'border-[#DCE7F5] bg-[#EEF4FF] text-[#2F66C8]'
                    : 'border-[#E7EDF5] bg-white text-[#5E6E8C] hover:bg-[#F8FAFE]'
                }`}
              >
                <span className="text-base font-medium">
                  {labelT(option.labelKey)}
                </span>

                {selected && <Check className="h-4 w-4 text-[#2F66C8]" />}
              </button>
            )
          })}
        </div>

        <p className="mt-2 text-sm text-[#7B8BA8]">
          {t('multiplePestsHint')}
        </p>
      </div>

      <div className="rounded-[24px] border border-[#E7EDF5] bg-[#F9FBFE] p-4">
        <p className="text-sm font-semibold text-[#5E6E8C]">
          {t('apartments')}
        </p>

        <div className="mt-3 space-y-3">
          <LocationField
            key={locationFieldKey}
            value={draftApartmentValue}
            onChange={({ formattedValue }) => {
              const cleanValue = sanitizeApartmentValue(formattedValue)

              if (formattedValue.includes(',')) {
                onMessage(oneApartmentErrorText)
              } else if (currentMessage === oneApartmentErrorText) {
                onMessage('')
              }

              setDraftApartmentValue(cleanValue)
            }}
          />

          <p className="text-xs text-[#7B8BA8]">
            {t('oneApartmentHint')}
          </p>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
              {t('visitType')}
            </label>

            <div className="grid grid-cols-1 gap-2">
              {visitTypeOptions.map((option) => {
                const selected = draftApartmentVisitType === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDraftApartmentVisitType(option.value)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? 'border-[#DCE7F5] bg-[#EEF4FF] text-[#2F66C8]'
                        : 'border-[#E7EDF5] bg-white text-[#5E6E8C] hover:bg-[#F8FAFE]'
                    }`}
                  >
                    <span className="text-base font-medium">
                      {labelT(option.labelKey)}
                    </span>

                    {selected && <Check className="h-4 w-4 text-[#2F66C8]" />}
                  </button>
                )
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onMessage('')
              const result = handleAddApartment()

              if (!result.ok && result.message) {
                onMessage(result.message)
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2F66C8] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(47,102,200,0.18)] transition hover:bg-[#2859B2]"
          >
            <Plus className="h-4 w-4" />
            {t('addApartment')}
          </button>
        </div>

        {selectedApartments.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedApartments.map((item, index) => (
              <div
                key={`${item.apartment_key || item.apartment_or_area}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[#E7EDF5] bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#142952]">
                    {item.apartment_or_area}
                  </p>
                  <p className="text-xs text-[#6E7F9D]">
                    {labelT(getVisitTypeKey(item.visit_type))}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveApartment(index)}
                  className="rounded-full bg-[#FFF4F5] p-2 text-[#D64555]"
                  aria-label={t('deleteApartment')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}