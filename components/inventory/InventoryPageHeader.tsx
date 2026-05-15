'use client'

import { BellDot, MessageSquareMore, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import InventoryHeaderActions from '@/components/inventory/InventoryHeaderActions'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import PageHeader from '@/components/layout/PageHeader'

type BuildingOption = {
  id: string
  name: string
  address: string | null
}

type InventoryPageHeaderProps = {
  compact: boolean
  buildingId: string
  buildingName: string
  buildings: BuildingOption[]
  canOpenConversation: boolean
  unreadMessageCount: number
  ownerRequestsOpenCount: number
  ownerRequestsUnreadCount: number
  onOpenConversationInbox: () => void
  onOpenOwnerRequests: () => void
  onOpenCreate: () => void
}

export default function InventoryPageHeader({
  compact,
  buildingId,
  buildingName,
  buildings,
  canOpenConversation,
  unreadMessageCount,
  ownerRequestsOpenCount,
  ownerRequestsUnreadCount,
  onOpenConversationInbox,
  onOpenOwnerRequests,
  onOpenCreate,
}: InventoryPageHeaderProps) {
  const pageT = useTranslations('inventoryPage')
  const headerT = useTranslations('conciergeHeader')

  return (
    <PageHeader
      compact={compact}
      title={pageT('title')}
      showUserButton
      expandedHeightClass="min-h-[248px]"
      compactHeightClass="h-[92px]"
      expandedTitleClass="pt-2 text-[38px] leading-none"
      compactTitleClass="pt-1 text-[24px] leading-none"
      secondaryAction={
        canOpenConversation
          ? {
              icon: <MessageSquareMore size={compact ? 20 : 24} />,
              label: headerT('openMessages'),
              count: unreadMessageCount,
              onClick: onOpenConversationInbox,
            }
          : null
      }
      rightSlot={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenOwnerRequests}
            className={`relative shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm ${
              ownerRequestsOpenCount > 0
                ? 'border-[#F6D48B] bg-[#FFF7E3] text-[#B7791F] hover:bg-[#FFF3D6]'
                : 'border-[#D9E0EA] bg-white/88 text-[#6E7F9D] hover:bg-white'
            } ${
              compact
                ? 'flex h-11 w-11 items-center justify-center rounded-[22px]'
                : 'flex h-14 w-14 items-center justify-center rounded-[22px]'
            }`}
            aria-label={headerT('openManagerEvents')}
          >
            <BellDot size={compact ? 20 : 22} />
            {ownerRequestsOpenCount > 0 ? (
              <span
                className={`absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none text-white ${
                  ownerRequestsUnreadCount > 0 ? 'bg-[#D64555]' : 'bg-[#D4A017]'
                }`}
              >
                {ownerRequestsOpenCount > 9 ? '9+' : ownerRequestsOpenCount}
              </span>
            ) : null}
          </button>

          {compact ? (
            <button
              type="button"
              onClick={onOpenCreate}
              className="flex h-11 w-11 items-center justify-center rounded-[22px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
              aria-label={pageT('newItem')}
            >
              <Plus size={22} />
            </button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {buildings.length > 1 ? (
          <ManagerBuildingChip
            buildingId={buildingId}
            buildingName={buildingName || pageT('noBuilding')}
            buildings={buildings}
            getBuildingHref={(nextBuildingId) =>
              `/inventory?buildingId=${nextBuildingId}`
            }
            label={headerT('currentBuilding')}
            mainHref="/dashboard"
            mainLabel={headerT('allBuildings')}
            mainDescription={headerT('backToOverview')}
            size="compact"
            singleBuildingMode="static"
          />
        ) : null}

        <InventoryHeaderActions
          buildingName={buildingName}
          onOpenCreate={onOpenCreate}
          showBuilding={buildings.length <= 1}
        />
      </div>
    </PageHeader>
  )
}
