'use client'

import { MessageSquare, UserRound } from 'lucide-react'
import type {
  BuildingSummary,
  ConciergeSummary,
} from '@/lib/manager/managerDashboardTypes'
import GlobalDashboardLink from '@/components/layout/GlobalDashboardLink'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import { getAvatarEmoji } from '@/lib/profile/avatarOptions'

type ManagerDashboardHeaderContentProps = {
  building: BuildingSummary
  buildings: Pick<BuildingSummary, 'id' | 'name' | 'address'>[]
  concierge: ConciergeSummary | null
  onOpenConversation: () => void
}

export default function ManagerDashboardHeaderContent({
  building,
  buildings,
  concierge,
  onOpenConversation,
}: ManagerDashboardHeaderContentProps) {
  const conciergeAvatar = getAvatarEmoji(concierge?.avatar_key)

  return (
    <div className="space-y-3">
      <div className="flex w-full max-w-full items-center justify-between gap-2">
        <div className="min-w-0">
          <ManagerBuildingChip
            buildingId={building.id}
            buildingName={building.name}
            buildings={buildings}
            label="Cambiar edificio"
            mainHref="/manager"
            mainLabel="Mis edificios"
            mainDescription="Ver todos tus edificios"
            size="compact"
          />
        </div>

        <GlobalDashboardLink href="/manager" label="Mis edificios" size="compact" />
      </div>

      <button
        type="button"
        disabled={!concierge}
        onClick={onOpenConversation}
        className={`flex w-full items-center justify-between rounded-[24px] border px-4 py-3 text-left shadow-[0_8px_24px_rgba(20,41,82,0.05)] transition ${
          !concierge
            ? 'cursor-not-allowed border-[#E7EDF5] bg-white/70 opacity-70'
            : 'border-[#E7EDF5] bg-white hover:border-[#C7D8F5] hover:bg-[#FBFCFF]'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <ConciergeAvatar
            avatarEmoji={conciergeAvatar}
            photoUrl={concierge?.profile_photo_url}
          />

          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-[#8C9AB3]">
              Conserje
            </span>
            <span className="block truncate text-[15px] font-bold text-[#142952]">
              {concierge?.name || 'Sin conserje asignado'}
            </span>
          </span>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-2 text-[13px] font-semibold text-[#2F66C8]">
          <MessageSquare size={14} />
          Mensaje
        </span>
      </button>
    </div>
  )
}

function ConciergeAvatar({
  avatarEmoji,
  photoUrl,
}: {
  avatarEmoji: string | null
  photoUrl?: string | null
}) {
  if (photoUrl) {
    return (
      <span
        className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center shadow-sm"
        style={{ backgroundImage: `url("${photoUrl}")` }}
        aria-hidden="true"
      />
    )
  }

  if (avatarEmoji) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[20px] shadow-sm">
        {avatarEmoji}
      </span>
    )
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F6FB] text-[#8C9AB3]">
      <UserRound size={18} />
    </span>
  )
}
