'use client'

import { useState } from 'react'
import { Building2, Check, Link2, Plus, Trash2 } from 'lucide-react'
import type { BuildingSummary } from '@/lib/buildings/buildingMembershipService'

type Props = {
  t: (key: string) => string
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
  const roleLabel = profileRole === 'manager' ? 'manager' : 'conserje'
  const shareMessage = `Usa este codigo para conectarte al edificio ${buildingName || 'en Conciergo'}: ${buildingInviteCode}`
  const encodedShareMessage = encodeURIComponent(shareMessage)

  const copyInviteCode = async () => {
    if (!buildingInviteCode) return

    await navigator.clipboard.writeText(buildingInviteCode)
  }

  const shareInviteCode = async () => {
    if (!buildingInviteCode) return

    if (navigator.share) {
      await navigator.share({
        title: 'Codigo de edificio',
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
              Mis edificios
            </div>
            <p className="mt-1 text-xs leading-5 text-[#8C9AB3]">
              Selecciona un edificio para editarlo o quitarlo de tu cuenta.
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
                        {building.address || 'Sin direccion'}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const confirmed = window.confirm(
                        `Quieres quitar "${building.name}" de tu cuenta? No se borraran sus tareas ni historial.`
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
                      ? 'Desvinculando...'
                      : 'Desvincular'}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[#D9E0EA] bg-[#F9FBFE] px-4 py-5 text-sm leading-6 text-[#6E7F9D]">
            Todavia no tienes edificios conectados. Crea uno nuevo o conectate
            con un codigo.
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
        <div className="mb-4 flex items-center gap-2 text-sm text-[#6E7F9D]">
          <Plus size={16} />
          Agregar o editar edificio
        </div>

      <div
        className={`mb-4 grid gap-3 ${
          hasBuilding ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {hasBuilding ? (
          <button
            type="button"
            onClick={() => setBuildingConnectionMode('edit')}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
              buildingConnectionMode === 'edit'
                ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
            }`}
          >
            Editar actual
          </button>
        ) : null}

          <button
            type="button"
            onClick={() => setBuildingConnectionMode('create')}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
              buildingConnectionMode === 'create'
                ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
            }`}
          >
            {hasBuilding ? 'Crear otro' : 'Crear edificio'}
          </button>

          <button
            type="button"
            onClick={() => setBuildingConnectionMode('join')}
            className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
              buildingConnectionMode === 'join'
                ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
            }`}
          >
            {hasBuilding ? 'Unirme' : 'Unirme con codigo'}
          </button>
      </div>

      {buildingConnectionMode === 'join' ? (
        <div>
          <label className="mb-2 block text-sm text-[#6E7F9D]">
            Codigo compartido del edificio
          </label>
          <input
            value={joinInviteCode}
            onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
            placeholder="BLDG-ABCD-1234"
            className="w-full rounded-xl border border-[#E2E8F0] px-4 py-3 uppercase text-[#142952] outline-none placeholder:text-[#94A3B8] focus:border-[#B8C8E6]"
          />
          <p className="mt-3 text-xs leading-5 text-[#6E7F9D]">
            Pide este codigo a la otra persona conectada al edificio.
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
                Codigo para compartir
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
                    Comparte este codigo para conectar otro {roleLabel} al
                    mismo edificio.
                  </p>

                  {shareOptionsOpen ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={copyInviteCode}
                        className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-sm font-semibold text-[#2F66C8]"
                      >
                        Copiar
                      </button>

                      <button
                        type="button"
                        onClick={shareInviteCode}
                        className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-sm font-semibold text-[#2F66C8]"
                      >
                        Compartir
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
                        Email
                      </a>

                      <a
                        href={`sms:?&body=${encodedShareMessage}`}
                        className="col-span-2 rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-center text-sm font-semibold text-[#2F66C8]"
                      >
                        Mensaje de texto
                      </a>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-xs leading-5 text-[#6E7F9D]">
                  Este edificio todavia no tiene codigo. Presiona Guardar
                  cambios para generarlo.
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
