'use client'

import {
  Building2,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Mail,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { avatarOptions } from '@/lib/profile/avatarOptions'

type Props = {
  t: (key: string) => string
  firstName: string
  lastName: string
  userEmail: string | null
  buildingName: string
  buildingsCount: number
  profileRole: 'concierge' | 'manager'
  avatarKey: string
  setAvatarKey: (value: string) => void
  profilePhotoUrl: string | null
  avatarPickerOpen: boolean
  setAvatarPickerOpen: (value: boolean | ((prev: boolean) => boolean)) => void
  avatarPickerRef: React.RefObject<HTMLDivElement | null>
  selectedAvatar: { key: string; emoji: string }
  onProfilePhotoSelected: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClearProfilePhoto: () => void
}

export default function SetupProfileAvatarCard({
  t,
  firstName,
  lastName,
  userEmail,
  buildingName,
  buildingsCount,
  profileRole,
  avatarKey,
  setAvatarKey,
  profilePhotoUrl,
  avatarPickerOpen,
  setAvatarPickerOpen,
  avatarPickerRef,
  selectedAvatar,
  onProfilePhotoSelected,
  onClearProfilePhoto,
}: Props) {
  const hasProfilePhoto = Boolean(profilePhotoUrl)
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    t('setupProfile.avatar.yourProfile')
  const roleLabel = profileRole === 'manager' ? 'Manager' : 'Conserje'
  const buildingCountLabel =
    buildingsCount === 1 ? '1 edificio' : `${buildingsCount} edificios`

  return (
    <div
      ref={avatarPickerRef}
      className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setAvatarPickerOpen((prev) => !prev)}
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#DCE7F5] bg-[#EEF4FF] text-[42px] shadow-sm transition hover:scale-[1.02]"
          aria-label={t('setupProfile.avatar.changeAvatar')}
        >
          {profilePhotoUrl ? (
            <span
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${profilePhotoUrl}")` }}
              aria-hidden="true"
            />
          ) : (
            selectedAvatar.emoji
          )}
        </button>

        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8C9AB3]">
            Cuenta
          </p>
          <h2 className="mt-1 truncate text-[22px] font-bold tracking-tight text-[#142952]">
            {displayName}
          </h2>
          <p className="mt-1 truncate text-sm font-medium text-[#6E7F9D]">
            {roleLabel}
          </p>
          <div className="mt-3 space-y-2 text-sm text-[#6E7F9D]">
            <p className="flex min-w-0 items-center gap-2">
              <Mail size={15} className="shrink-0 text-[#8C9AB3]" />
              <span className="truncate">
                {userEmail || t('setupProfile.personalInfo.noEmail')}
              </span>
            </p>
            <p className="flex min-w-0 items-center gap-2">
              <Building2 size={15} className="shrink-0 text-[#8C9AB3]" />
              <span className="truncate">
                {buildingName || t('setupProfile.avatar.noBuildingAssigned')}
              </span>
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-semibold text-[#2F66C8]">
              {buildingCountLabel}
            </span>
            <button
              type="button"
              onClick={() => setAvatarPickerOpen((prev) => !prev)}
              className="rounded-full bg-[#F6F8FC] px-3 py-1.5 text-xs font-semibold text-[#2F66C8]"
            >
              {avatarPickerOpen
                ? 'Ocultar opciones'
                : hasProfilePhoto
                  ? 'Cambiar foto'
                  : t('setupProfile.avatar.changeAvatar')}
            </button>
          </div>
        </div>
      </div>

      {avatarPickerOpen && (
        <div className="mt-5">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#E7EDF5] bg-[#F9FBFE] px-3 py-3 text-sm font-semibold text-[#2F66C8] transition hover:bg-[#F3F7FD]">
              <Camera size={16} />
              Tomar foto
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={onProfilePhotoSelected}
                className="hidden"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#E7EDF5] bg-white px-3 py-3 text-sm font-semibold text-[#142952] transition hover:bg-[#F8FAFE]">
              <ImageIcon size={16} />
              Subir foto
              <input
                type="file"
                accept="image/*"
                onChange={onProfilePhotoSelected}
                className="hidden"
              />
            </label>
          </div>

          {hasProfilePhoto ? (
            <button
              type="button"
              onClick={onClearProfilePhoto}
              className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F1D3D3] bg-[#FFF8F8] px-3 py-3 text-sm font-semibold text-[#C53030] transition hover:bg-[#FFF1F1]"
            >
              <Trash2 size={15} />
              Quitar foto y usar avatar
            </button>
          ) : null}

          <div className="mb-3 flex items-center gap-2 text-sm text-[#6E7F9D]">
            <Sparkles size={16} />
            O elige un avatar
          </div>

          <div className="grid grid-cols-4 gap-3">
            {avatarOptions.map((avatar) => {
              const selected = avatar.key === avatarKey

              return (
                <button
                  key={avatar.key}
                  type="button"
                  onClick={() => setAvatarKey(avatar.key)}
                  className={`relative flex h-16 items-center justify-center rounded-2xl border text-[28px] transition ${
                    selected
                      ? 'border-[#2F66C8] bg-[#EEF4FF] shadow-[0_6px_18px_rgba(47,102,200,0.16)]'
                      : 'border-[#E7EDF5] bg-white hover:bg-[#F8FAFE]'
                  }`}
                  aria-label={`${t('setupProfile.avatar.option')} ${avatar.key}`}
                >
                  {avatar.emoji}
                  {selected && (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-[#2F66C8] p-1 text-white">
                      <CheckCircle2 size={12} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
