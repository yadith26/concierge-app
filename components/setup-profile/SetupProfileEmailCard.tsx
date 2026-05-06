'use client'

import { ChevronDown, Mail } from 'lucide-react'
import { useState } from 'react'

type Props = {
  currentEmail: string | null
  emailChangeMessage: string
  emailChangeMessageType: 'success' | 'error' | ''
  newEmail: string
  onChangeNewEmail: (value: string) => void
  onSubmitEmailChange: () => void
  saving: boolean
  t: (key: string) => string
}

export default function SetupProfileEmailCard({
  currentEmail,
  emailChangeMessage,
  emailChangeMessageType,
  newEmail,
  onChangeNewEmail,
  onSubmitEmailChange,
  saving,
  t,
}: Props) {
  const [editingEmail, setEditingEmail] = useState(false)

  return (
    <div className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-[#6E7F9D]">
          <Mail size={16} />
          {t('setupProfile.emailAccess.title')}
        </div>

        <button
          type="button"
          onClick={() => setEditingEmail((current) => !current)}
          className="inline-flex items-center gap-1 rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-bold text-[#2F66C8]"
        >
          Editar correo
          <ChevronDown
            size={14}
            className={`transition ${editingEmail ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <div className="rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8C9AB3]">
          {t('setupProfile.emailAccess.currentEmail')}
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-[#142952]">
          {currentEmail || t('setupProfile.personalInfo.noEmail')}
        </p>
      </div>

      {editingEmail ? (
        <>
          <label className="mb-2 mt-4 block text-sm text-[#6E7F9D]">
            {t('setupProfile.emailAccess.newEmail')}
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(event) => onChangeNewEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[#142952] outline-none placeholder:text-[#94A3B8] focus:border-[#B8C8E6]"
          />

          <p className="mt-3 text-xs leading-5 text-[#6E7F9D]">
            {t('setupProfile.emailAccess.help')}
          </p>

          <button
            type="button"
            onClick={onSubmitEmailChange}
            disabled={saving}
            className="mt-4 w-full rounded-2xl border border-[#DCE7F5] bg-[#EEF4FF] px-4 py-3 text-sm font-semibold text-[#2F66C8] transition hover:bg-[#E7F0FF] disabled:opacity-60"
          >
            {saving
              ? t('setupProfile.emailAccess.sending')
              : t('setupProfile.emailAccess.sendConfirmation')}
          </button>
        </>
      ) : null}

      {emailChangeMessage ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3 text-center text-sm font-medium ${
            emailChangeMessageType === 'success'
              ? 'border border-[#D8E9DB] bg-[#F3FBF5] text-[#1F7A3D]'
              : 'border border-[#F1D3D3] bg-[#FFF5F5] text-[#C53030]'
          }`}
        >
          {emailChangeMessage}
        </div>
      ) : null}
    </div>
  )
}
