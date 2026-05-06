'use client'

import { User, ChevronDown, Check } from 'lucide-react'
import { languageOptions } from '@/hooks/useSetupProfilePage'

type Props = {
  t: (key: string) => string
  firstName: string
  setFirstName: (value: string) => void
  lastName: string
  setLastName: (value: string) => void
  locale: string
  setLocale: (value: string) => void
  languageOpen: boolean
  setLanguageOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  languageRef: React.RefObject<HTMLDivElement | null>
  selectedLanguage: { value: string; label: string }
}

export default function SetupProfilePersonalInfoCard({
  t,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  locale,
  setLocale,
  languageOpen,
  setLanguageOpen,
  languageRef,
  selectedLanguage,
}: Props) {
  return (
    <div className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="mb-4 flex items-center gap-2 text-sm text-[#6E7F9D]">
        <User size={16} />
        {t('setupProfile.personalInfo.title')}
      </div>

      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder={t('setupProfile.personalInfo.firstName')}
        className="mb-3 w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[#142952] outline-none placeholder:text-[#94A3B8] focus:border-[#B8C8E6]"
      />

      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder={t('setupProfile.personalInfo.lastName')}
        className="mb-3 w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[#142952] outline-none placeholder:text-[#94A3B8] focus:border-[#B8C8E6]"
      />

      <div ref={languageRef} className="mt-4">
        <label className="mb-2 block text-sm text-[#6E7F9D]">
          {t('setupProfile.personalInfo.language')}
        </label>

        <div className="relative">
          <button
            type="button"
            onClick={() => setLanguageOpen((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-left text-[#142952] outline-none transition hover:border-[#B8C8E6] focus:border-[#B8C8E6]"
          >
            <span className="text-[18px]">{selectedLanguage.label}</span>
            <ChevronDown
              size={20}
              className={`text-[#6E7F9D] transition-transform ${
                languageOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {languageOpen && (
            <div className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-[22px] border border-[#E7EDF5] bg-white shadow-[0_14px_30px_rgba(20,41,82,0.12)]">
              {languageOptions.map((option) => {
                const isSelected = locale === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setLocale(option.value)
                      setLanguageOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-4 text-left text-[18px] transition ${
                      isSelected
                        ? 'bg-[#EEF4FF] text-[#2F66C8]'
                        : 'bg-white text-[#5E6E8C] hover:bg-[#F8FAFE]'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected ? (
                      <Check size={18} className="text-[#2F66C8]" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
