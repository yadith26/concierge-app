'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertTriangle,
  BellDot,
  Clock3,
  ListTodo,
  MessageSquareMore,
} from 'lucide-react'

import AppHeader from '@/components/layout/AppHeader'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'

type BuildingOption = {
  id: string
  name: string
  address: string | null
}

type ConciergeDashboardHeaderProps = {
  compact: boolean
  isHomeView: boolean
  userName: string
  subtitle?: string
  avatarKey: string | null
  profilePhotoUrl: string | null
  canOpenMessages: boolean
  globalUnreadMessageCount: number
  unreadMessageCount: number
  onOpenMessages: () => void
  showOwnerRequests: boolean
  ownerRequestsOpenCount: number
  ownerRequestsUnreadCount: number
  onOpenOwnerRequests: () => void
  buildingId: string
  buildingName: string
  buildings: BuildingOption[]
  showManagerNotLinkedMessage?: boolean
  managerNotLinkedMessage?: string
  todayTasksCount: number
  urgentCount: number
  overdueCount: number
  onOpenTodayTasks: () => void
  onOpenUrgentTasks: () => void
  onOpenOverdueTasks: () => void
}

export default function ConciergeDashboardHeader({
  compact,
  isHomeView,
  userName,
  subtitle,
  avatarKey,
  profilePhotoUrl,
  canOpenMessages,
  globalUnreadMessageCount,
  unreadMessageCount,
  onOpenMessages,
  showOwnerRequests,
  ownerRequestsOpenCount,
  ownerRequestsUnreadCount,
  onOpenOwnerRequests,
  buildingId,
  buildingName,
  buildings,
  showManagerNotLinkedMessage = false,
  managerNotLinkedMessage = '',
  todayTasksCount,
  urgentCount,
  overdueCount,
  onOpenTodayTasks,
  onOpenUrgentTasks,
  onOpenOverdueTasks,
}: ConciergeDashboardHeaderProps) {
  const headerT = useTranslations('conciergeHeader')
  const dashboardT = useTranslations('dashboard')
  const [buildingMenuOpen, setBuildingMenuOpen] = useState(false)
  const secondaryStatusLabel =
    overdueCount > 0
      ? dashboardT('headerPills.overdue', { count: overdueCount })
      : dashboardT('headerPills.urgent', { count: urgentCount })
  const handleOpenSecondaryStatus =
    overdueCount > 0 ? onOpenOverdueTasks : onOpenUrgentTasks

  return (
    <AppHeader
      compact={compact}
      showGreeting
      showGreetingWave
      userName={userName}
      showDate
      subtitle={subtitle}
      rightIconLink="/setup-profile"
      avatarKey={avatarKey}
      profilePhotoUrl={profilePhotoUrl}
      secondaryAction={
        canOpenMessages
          ? {
              icon: <MessageSquareMore size={compact ? 20 : 22} />,
              label: headerT('openMessages'),
              count: globalUnreadMessageCount || unreadMessageCount,
              onClick: onOpenMessages,
            }
          : null
      }
      rightSlot={
        !isHomeView && showOwnerRequests ? (
          <button
            type="button"
            onClick={onOpenOwnerRequests}
            className={`relative shrink-0 shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm ${
              ownerRequestsOpenCount > 0
                ? 'border-[#F6D48B] bg-[#FFF7E3] text-[#B7791F] hover:bg-[#FFF3D6]'
                : 'border-[#D9E0EA] bg-white/85 text-[#6E7F9D] hover:bg-white'
            } ${
              compact
                ? 'flex h-11 w-11 items-center justify-center rounded-[22px]'
                : 'flex h-12 w-12 items-center justify-center rounded-[20px]'
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
        ) : null
      }
      headerContent={
        buildingId && !isHomeView ? (
          <div className="space-y-3">
            <div className="relative z-30 flex w-full items-center justify-between gap-3 rounded-[20px] border border-[#E5ECF6] bg-white/94 px-4 py-2.5 text-[#142952] shadow-[0_10px_24px_rgba(20,41,82,0.07)] backdrop-blur-sm">
              <div className="min-w-0 flex-1">
                <ManagerBuildingChip
                  buildingId={buildingId}
                  buildingName={buildingName}
                  buildings={buildings}
                  getBuildingHref={(nextBuildingId) =>
                    `/dashboard?buildingId=${nextBuildingId}`
                  }
                  label={headerT('currentBuilding')}
                  mainHref="/dashboard"
                  mainLabel={headerT('allBuildings')}
                  mainDescription={headerT('backToOverview')}
                  size="compact"
                  singleBuildingMode="static"
                  appearance="embedded"
                  onOpenChange={setBuildingMenuOpen}
                />
              </div>

              {showManagerNotLinkedMessage ? (
                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#FFF4F5] px-2.5 py-1 text-[11px] font-bold leading-none text-[#C94C5F]">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span className="max-w-[120px] truncate">{managerNotLinkedMessage}</span>
                </div>
              ) : null}
            </div>

            <div
              className={`relative z-10 grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#E5ECF6] bg-white/94 text-[#142952] shadow-[0_10px_24px_rgba(20,41,82,0.07)] backdrop-blur-sm transition-all duration-200 ${
                buildingMenuOpen
                  ? 'pointer-events-none -translate-y-2 opacity-0'
                  : 'translate-y-0 opacity-100'
              }`}
            >
              <button
                type="button"
                onClick={onOpenTodayTasks}
                className="flex items-center justify-center gap-3 px-4 py-3 text-[15px] font-bold active:scale-[0.98]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF4FF] text-[#2F66C8]">
                  <ListTodo size={17} />
                </span>
                {dashboardT('headerPills.pending', { count: todayTasksCount })}
              </button>

              <button
                type="button"
                onClick={handleOpenSecondaryStatus}
                className="flex items-center justify-center gap-3 border-l border-[#D9E2F0] px-4 py-3 text-[15px] font-bold active:scale-[0.98]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF4E8] text-[#F08A24]">
                  <Clock3 size={17} />
                </span>
                {secondaryStatusLabel}
              </button>
            </div>
          </div>
        ) : null
      }
    />
  )
}
