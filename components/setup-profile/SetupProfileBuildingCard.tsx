'use client'

import { useState } from 'react'
import { Building2, Check, Link2, Plus, Trash2 } from 'lucide-react'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'

type Props = {
  t: (key: string, values?: Record<string, string | number>) => string
  buildings: BuildingSummary[]
  selectedBuildingId: string | null
  buildingName: string
  setBuildingName: (value: string) => void
  buildingAddress: string
  setBuildingAddress: (value: string) => void
  buildingInviteCode: string
  joinInviteCode: string
  setJoinInviteCode: (value: string) => void
  buildingConnectionMode: 'edit' | 'create' | 'join'
  setBuildingConnectionMode: (value: 'edit' | 'create' | 'join') => void
  profileRole: 'concierge' | 'manager'
  hasBuilding: boolean
  disconnectingBuildingId: string | null
  onSelectBuilding: (building: BuildingSummary) => void
  onDisconnectBuilding: (building: BuildingSummary) => void
}

export default function SetupProfileBuildingCard({
  t,
  buildings,
  selectedBuildingId,
  buildingName,
  setBuildingName,
  buildingAddress,
  setBuildingAddress,
  buildingInviteCode,
  joinInviteCode,
  setJoinInviteCode,
  buildingConnectionMode,
  setBuildingConnectionMode,
  profileRole,
  hasBuilding,
  disconnectingBuildingId,
  onSelectBuilding,
  onDisconnectBuilding,
}: Props) {
  const [shareOptionsOpen, setShareOptionsOpen] = useState(false)
  const roleLabel = t(`setupProfile.buildingsCard.roles.${profileRole}`)
  const shareMessage = t('setupProfile.buildingsCard.shareMessage', {
    building: buildingName || 'Conciergo',
    code: buildingInviteCode,
  })
  const encodedShareMessage = encodeURIComponent(shareMessage)

  const copyInviteCode = async () => {
    if (!buildingInviteCode) return

    await navigator.clipboard.writeText(buildingInviteCode)
  }

  const shareInviteCode = async () => {
    if (!buildingInviteCode) return

    if (navigator.share) {
      await navigator.share({
        title: t('setupProfile.buildingsCard.shareTitle'),
        text: shareMessage,
      })
      return
    }

    await copyInviteCode()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#6E7F9D]">
              <Building2 size={16} />
              {t('setupProfile.buildingsCard.myBuildings')}
            </div>
            <p className="mt-1 text-xs leading-5 text-[#8C9AB3]">
              {t('setupProfile.buildingsCard.myBuildingsDescription')}
            </p>
          </div>
          <span className="rounded-full bg-[#EEF4FF] px-3 py-1.5 text-xs font-semibold text-[#2F66C8]">
            {buildings.length}
          </span>
        </div>

        {buildings.length > 0 ? (
          <div className="space-y-3">
            {buildings.map((building) => {
              const active = building.id === selectedBuildingId

              return (
                <div
                  key={building.id}
                  className={`rounded-[22px] border p-3 transition ${
                    active
                      ? 'border-[#C7D8F5] bg-[#F8FAFE]'
                      : 'border-[#E7EDF5] bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBuilding(building)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                        active
                          ? 'bg-[#EEF4FF] text-[#2F66C8]'
                          : 'bg-[#F3F6FB] text-[#8C9AB3]'
                      }`}
                    >
                      {active ? <Check size={18} /> : <Building2 size={18} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[#142952]">
                        {building.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-[#8C9AB3]">
                        {building.address || t('setupProfile.buildingsCard.noAddress')}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm(
                        t('setupProfile.buildingsCard.unlinkConfirm', {
                          building: building.name,
                        })
                      )

                      if (confirmed) {
                        onDisconnectBuilding(building)
                      }
                    }}
                    disabled={disconnectingBuildingId === building.id}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#F1D3D3] bg-[#FFF8F8] px-3 py-2.5 text-xs font-semibold text-[#C53030] transition hover:bg-[#FFF1F1] disabled:opacity-60"
                  >
                    <Trash2 size={14} />
                    {disconnectingBuildingId === building.id
                      ? t('setupProfile.buildingsCard.unlinking')
                      : t('setupProfile.buildingsCard.unlink')}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#D9E0EA] bg-[#F9FBFE] px-4 py-5 text-sm leading-6 text-[#6E7F9D]">
            {t('setupProfile.buildingsCard.noBuildings')}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
        <div className="mb-4 flex items-center gap-2 text-sm text-[#6E7F9D]">
          <Plus size={16} />
          {t('setupProfile.buildingsCard.addOrEdit')}
        </div>

      <div
        className={`mb-4 grid gap-3 ${
          hasBuilding
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {hasBuilding ? (
          <button
            type="button"
            onClick={() => setBuildingConnectionMode('edit')}
            className={`rounded-2xl border px-2.5 py-2.5 text-center text-xs font-semibold leading-4 transition sm:px-3 sm:py-3 sm:text-sm sm:leading-5 ${
              buildingConnectionMode === 'edit'
                ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
            }`}
          >
            {t('setupProfile.buildingsCard.editCurrent')}
          </button>
        ) : null}

          <button
            type="button"
            onClick={() => setBuildingConnectionMode('create')}
            className={`rounded-2xl border px-2.5 py-2.5 text-center text-xs font-semibold leading-4 transition sm:px-3 sm:py-3 sm:text-sm sm:leading-5 ${
              buildingConnectionMode === 'create'
                ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
            }`}
          >
            {hasBuilding
              ? t('setupProfile.buildingsCard.createAnother')
              : t('setupProfile.buildingsCard.createBuilding')}
          </button>

          <button
            type="button"
            onClick={() => setBuildingConnectionMode('join')}
            className={`rounded-2xl border px-2.5 py-2.5 text-center text-xs font-semibold leading-4 transition sm:px-3 sm:py-3 sm:text-sm sm:leading-5 ${
              buildingConnectionMode === 'join'
                ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
            }`}
          >
            {hasBuilding
              ? t('setupProfile.buildingsCard.join')
              : t('setupProfile.buildingsCard.joinWithCode')}
          </button>
      </div>

      {buildingConnectionMode === 'join' ? (
        <div>
          <label className="mb-2 block text-sm text-[#6E7F9D]">
            {t('setupProfile.buildingsCard.sharedCode')}
          </label>
          <input
            value={joinInviteCode}
            onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
            placeholder="BLDG-ABCD-1234"
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 uppercase text-[#142952] outline-none placeholder:text-[#94A3B8] focus:border-[#B8C8E6]"
          />
          <p className="mt-3 text-xs leading-5 text-[#6E7F9D]">
            {t('setupProfile.buildingsCard.sharedCodeHelp')}
          </p>
        </div>
      ) : (
        <>
          <input
            value={buildingName}
            onChange={(e) => setBuildingName(e.target.value)}
            placeholder={t('setupProfile.buildingInfo.buildingName')}
            className="mb-3 w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[#142952] outline-none placeholder:text-[#94A3B8] focus:border-[#B8C8E6]"
          />

          <input
            value={buildingAddress}
            onChange={(e) => setBuildingAddress(e.target.value)}
            placeholder={t('setupProfile.buildingInfo.address')}
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 text-[#142952] outline-none placeholder:text-[#94A3B8] focus:border-[#B8C8E6]"
          />

          {buildingConnectionMode === 'edit' && hasBuilding ? (
            <div className="mt-4 rounded-2xl border border-[#DCE7F5] bg-[#F8FAFE] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#142952]">
                <Link2 size={16} />
                {t('setupProfile.buildingsCard.codeToShare')}
              </div>
              {buildingInviteCode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShareOptionsOpen((prev) => !prev)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-left font-mono text-sm font-semibold tracking-wide text-[#2F66C8]"
                  >
                    {buildingInviteCode}
                  </button>
                  <p className="mt-2 text-xs leading-5 text-[#6E7F9D]">
                    {t('setupProfile.buildingsCard.shareHelp', {
                      role: roleLabel,
                    })}
                  </p>

                  {shareOptionsOpen ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={copyInviteCode}
                        className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-sm font-semibold text-[#2F66C8]"
                      >
                        {t('setupProfile.buildingsCard.copy')}
                      </button>

                      <button
                        type="button"
                        onClick={shareInviteCode}
                        className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-sm font-semibold text-[#2F66C8]"
                      >
                        {t('setupProfile.buildingsCard.share')}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodedShareMessage}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2F66C8]"
                      >
                        WhatsApp
                      </a>

                      <a
                        href={`mailto:?subject=Codigo de edificio&body=${encodedShareMessage}`}
                        className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2F66C8]"
                      >
                        {t('setupProfile.buildingsCard.email')}
                      </a>

                      <a
                        href={`sms:?&body=${encodedShareMessage}`}
                        className="col-span-2 rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2F66C8]"
                      >
                        {t('setupProfile.buildingsCard.textMessage')}
                      </a>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-xs leading-5 text-[#6E7F9D]">
                  {t('setupProfile.buildingsCard.noCodeYet')}
                </p>
              )}
            </div>
          ) : null}
        </>
      )}
      </div>
    </div>
  )
}
