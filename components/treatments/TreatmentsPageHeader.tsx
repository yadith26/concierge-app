'use client'

import { BellDot, Download, MessageSquareMore, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import PageHeader from '@/components/layout/PageHeader'
import type { PestTreatmentRow } from '@/lib/tasks/pestTypes'

type BuildingOption = {
  id: string
  name: string
  address: string | null
}

type TreatmentsTab = 'scheduled' | 'history'

type TreatmentsPageHeaderProps = {
  compact: boolean
  activeTab: TreatmentsTab
  buildingId: string
  buildingName: string
  buildings: BuildingOption[]
  filteredTreatments: PestTreatmentRow[]
  canOpenConversation: boolean
  unreadMessageCount: number
  ownerRequestsOpenCount: number
  ownerRequestsUnreadCount: number
  onOpenConversationInbox: () => void
  onOpenOwnerRequests: () => void
  onOpenCreateTreatment: () => void
  onExportHistory: (treatments: PestTreatmentRow[]) => void
}

export default function TreatmentsPageHeader({
  compact,
  activeTab,
  buildingId,
  buildingName,
  buildings,
  filteredTreatments,
  canOpenConversation,
  unreadMessageCount,
  ownerRequestsOpenCount,
  ownerRequestsUnreadCount,
  onOpenConversationInbox,
  onOpenOwnerRequests,
  onOpenCreateTreatment,
  onExportHistory,
}: TreatmentsPageHeaderProps) {
  const t = useTranslations('treatmentsPage')
  const headerT = useTranslations('conciergeHeader')

  return (
    <PageHeader
      compact={compact}
      title={t('title')}
      showUserButton
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
              onClick={onOpenCreateTreatment}
              className="flex h-11 w-11 items-center justify-center rounded-[22px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
              aria-label={t('newTreatment')}
            >
              <Plus size={22} />
            </button>
          ) : null}
        </div>
      }
    >
      <div
        className={`relative z-40 transition-all duration-300 ${
          compact
            ? 'pointer-events-none max-h-0 -translate-y-2 overflow-hidden opacity-0'
            : 'max-h-[220px] translate-y-0 overflow-visible opacity-100'
        }`}
      >
        <ManagerBuildingChip
          buildingId={buildingId}
          buildingName={buildingName || t('noBuilding')}
          buildings={buildings}
          getBuildingHref={(nextBuildingId) =>
            `/treatments?buildingId=${nextBuildingId}`
          }
          label={t('building')}
          mainHref="/dashboard"
          mainLabel={headerT('allBuildings')}
          mainDescription={headerT('backToOverview')}
          size="compact"
          singleBuildingMode="static"
        />

        {activeTab === 'scheduled' ? (
          <button
            type="button"
            onClick={onOpenCreateTreatment}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-[28px] bg-[#3E63E6] px-5 py-3.5 text-[17px] font-semibold text-white shadow-[0_16px_30px_rgba(62,99,230,0.28)] hover:bg-[#3558D8]"
          >
            <Plus size={26} />
            {t('newTreatment')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onExportHistory(filteredTreatments)}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-[28px] border border-[#DCE7F5] bg-white px-5 py-3.5 text-[17px] font-semibold text-[#2F66C8] shadow-[0_12px_24px_rgba(20,41,82,0.08)] hover:bg-[#F8FBFF]"
          >
            <Download size={22} />
            {t('exportExcel')}
          </button>
        )}
      </div>
    </PageHeader>
  )
}
