'use client'

import { AlertTriangle, BellDot, MessageSquareMore } from 'lucide-react'

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
  const buildingShellClass = showManagerNotLinkedMessage
    ? 'flex w-full items-center justify-between gap-3 rounded-[28px] border border-[#D9E0EA] bg-white/92 px-4 py-3 text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm'
    : 'inline-flex max-w-full items-center gap-3 rounded-[28px] border border-[#D9E0EA] bg-white/92 px-4 py-3 text-[#142952] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm'

  return (
    <AppHeader
      compact={compact}
      showGreeting
      userName={userName}
      showDate
      subtitle={!isHomeView ? subtitle : undefined}
      rightIconLink="/setup-profile"
      avatarKey={avatarKey}
      profilePhotoUrl={profilePhotoUrl}
      secondaryAction={
        canOpenMessages
          ? {
              icon: <MessageSquareMore size={compact ? 20 : 22} />,
              label: 'Abrir mensajes',
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
                : 'flex h-14 w-14 items-center justify-center rounded-[22px]'
            }`}
            aria-label="Abrir eventos del manager"
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
          <>
            <div className={buildingShellClass}>
              <div className={showManagerNotLinkedMessage ? 'min-w-0 flex-1' : 'min-w-0'}>
                <ManagerBuildingChip
                  buildingId={buildingId}
                  buildingName={buildingName}
                  buildings={buildings}
                  getBuildingHref={(nextBuildingId) =>
                    `/dashboard?buildingId=${nextBuildingId}`
                  }
                  label="Edificio actual"
                  mainHref="/dashboard"
                  mainLabel="Mis edificios"
                  mainDescription="Volver a la vista general"
                  size="compact"
                  singleBuildingMode="static"
                  appearance="embedded"
                />
              </div>

              {showManagerNotLinkedMessage ? (
                <div className="flex shrink-0 items-center gap-2 text-[13px] font-semibold leading-none text-[#C94C5F]">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{managerNotLinkedMessage}</span>
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenTodayTasks}
                className="rounded-full bg-white/80 px-3 py-1.5 text-[13px] font-bold text-[#142952] shadow-[0_6px_16px_rgba(20,41,82,0.06)] active:scale-[0.97]"
              >
                {todayTasksCount} pendientes
              </button>

              {urgentCount > 0 ? (
                <button
                  type="button"
                  onClick={onOpenUrgentTasks}
                  className="rounded-full bg-[#FFF4F5]/90 px-3 py-1.5 text-[13px] font-bold text-[#D64555] shadow-[0_6px_16px_rgba(214,69,85,0.08)] active:scale-[0.97]"
                >
                  {urgentCount} urgente
                </button>
              ) : null}

              {overdueCount > 0 ? (
                <button
                  type="button"
                  onClick={onOpenOverdueTasks}
                  className="rounded-full bg-[#FFF8E8]/90 px-3 py-1.5 text-[13px] font-bold text-[#D9811E] shadow-[0_6px_16px_rgba(217,129,30,0.08)] active:scale-[0.97]"
                >
                  {overdueCount} atrasadas
                </button>
              ) : null}
            </div>
          </>
        ) : null
      }
    />
  )
}
