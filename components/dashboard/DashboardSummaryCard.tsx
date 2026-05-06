'use client'

import { AlertCircle, Building2, CheckCircle2, Clock3 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'

type StatusFilter = 'all' | 'urgent' | 'pending' | 'completed'

type DashboardSummaryCardProps = {
  buildingName: string
  urgentCount: number
  pendingCount: number
  completedCount: number
  statusFilter: StatusFilter
  onChangeFilter: (filter: StatusFilter) => void
}

export default function DashboardSummaryCard({
  buildingName,
  urgentCount,
  pendingCount,
  completedCount,
  statusFilter,
  onChangeFilter,
}: DashboardSummaryCardProps) {
  const t = useTranslations('dashboard.summaryCard')

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#E7EDF5] bg-white shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F3F6FB] text-[#8C9AB3]">
          <Building2 size={20} />
        </div>

        <div className="min-w-0">
          <p className="text-sm text-[#6E7F9D]">{t('building')}</p>
          <h2 className="truncate text-[22px] font-bold tracking-tight text-[#142952]">
            {buildingName || t('noBuilding')}
          </h2>
        </div>
      </div>

      <div className="mx-5 border-t border-[#E8EEF6]" />

      <div className="grid grid-cols-3">
        <MiniStat
          title={t('urgent')}
          value={urgentCount}
          icon={<AlertCircle size={15} />}
          tone="amber"
          bordered
          active={statusFilter === 'urgent'}
          onClick={() =>
            onChangeFilter(statusFilter === 'urgent' ? 'all' : 'urgent')
          }
        />

        <MiniStat
          title={t('pending')}
          value={pendingCount}
          icon={<Clock3 size={15} />}
          tone="slate"
          bordered
          active={statusFilter === 'pending'}
          onClick={() =>
            onChangeFilter(statusFilter === 'pending' ? 'all' : 'pending')
          }
        />

        <MiniStat
          title={t('completed')}
          value={completedCount}
          icon={<CheckCircle2 size={15} />}
          tone="green"
          active={statusFilter === 'completed'}
          onClick={() =>
            onChangeFilter(statusFilter === 'completed' ? 'all' : 'completed')
          }
        />
      </div>
    </div>
  )
}

function MiniStat({
  title,
  value,
  icon,
  tone,
  bordered = false,
  active = false,
  onClick,
}: {
  title: string
  value: number
  icon: ReactNode
  tone: 'slate' | 'amber' | 'green'
  bordered?: boolean
  active?: boolean
  onClick?: () => void
}) {
  const styles = {
    slate: {
      pill: 'bg-[#EEF2F8] text-[#60739A]',
      icon: 'bg-[#E3EAF3] text-[#60739A]',
      activeSurface:
        'bg-[#F7FAFF] shadow-[inset_0_0_0_1px_rgba(47,102,200,0.16)]',
      activePill: 'bg-[#EAF1FF] text-[#2F66C8]',
      activeIcon: 'bg-[#DCE7FF] text-[#2F66C8]',
    },
    amber: {
      pill: 'bg-[#FDF0C8] text-[#C97800]',
      icon: 'bg-[#F8E0A0] text-[#CC7A00]',
      activeSurface:
        'bg-[#FFFBF2] shadow-[inset_0_0_0_1px_rgba(245,158,11,0.18)]',
      activePill: 'bg-[#FBE7B2] text-[#BC7400]',
      activeIcon: 'bg-[#F6D98E] text-[#BC7400]',
    },
    green: {
      pill: 'bg-[#DDF3E6] text-[#0F8A4B]',
      icon: 'bg-[#CBEBD8] text-[#0F8A4B]',
      activeSurface:
        'bg-[#F4FCF7] shadow-[inset_0_0_0_1px_rgba(34,160,107,0.18)]',
      activePill: 'bg-[#D7F0E1] text-[#177B52]',
      activeIcon: 'bg-[#C4E7D2] text-[#177B52]',
    },
  }

  const current = styles[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-4 text-center transition ${
        bordered ? 'border-r border-[#EEF3F8]' : ''
      } ${active ? current.activeSurface : 'bg-white hover:bg-[#FAFCFF]'}`}
    >
      <div className="mb-3 flex justify-center">
        <div
          className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-2 ${
            active ? current.activePill : current.pill
          }`}
        >
          <div
            className={`rounded-full p-1 ${
              active ? current.activeIcon : current.icon
            }`}
          >
            {icon}
          </div>

          <span className="truncate text-[11px] font-semibold leading-none">
            {title}
          </span>
        </div>
      </div>

      <p className="text-[40px] font-bold leading-none text-[#142952]">
        {value}
      </p>
    </button>
  )
}