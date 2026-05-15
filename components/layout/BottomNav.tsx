'use client'

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation'
import {
  ClipboardList,
  House,
  Calendar,
  Package,
  Shield,
  type LucideIcon,
} from 'lucide-react'

type BottomNavProps = {
  active: 'dashboard' | 'tasks' | 'agenda' | 'inventory' | 'treatments'
  buildingId?: string
}

export default function BottomNav({ active, buildingId }: BottomNavProps) {
  const t = useTranslations('nav');

  const withBuilding = (path: string) => {
    return buildingId ? `${path}?buildingId=${buildingId}` : path
  }

  return (
    <nav className="shrink-0 border-t border-[#E3EAF3] bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-around">
        <BottomNavItem
          active={active === 'dashboard'}
          href={withBuilding('/dashboard')}
          icon={House}
          label={t('home')}
        />
        <BottomNavItem
          active={active === 'tasks'}
          href={withBuilding('/tasks')}
          icon={ClipboardList}
          label={t('tasks')}
        />
        <BottomNavItem
          active={active === 'inventory'}
          href={withBuilding('/inventory')}
          icon={Package}
          label={t('inventory')}
        />
        <BottomNavItem
          active={active === 'treatments'}
          href={withBuilding('/treatments')}
          icon={Shield}
          label={t('treatments')}
        />
        <BottomNavItem
          active={active === 'agenda'}
          href={withBuilding('/agenda')}
          icon={Calendar}
          label={t('agenda')}
        />
      </div>
    </nav>
  )
}

function BottomNavItem({
  active,
  href,
  icon: Icon,
  label,
}: {
  active: boolean
  href: string
  icon: LucideIcon
  label: string
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-w-[64px] flex-col items-center gap-1 transition ${
        active ? 'text-[#315DFF]' : 'text-[#7B8BA8]'
      }`}
    >
      {active ? (
        <span className="absolute -top-2 h-0.5 w-7 rounded-full bg-[#315DFF]" />
      ) : null}
      <Icon
        size={24}
        strokeWidth={active ? 2.75 : 2}
        className={active ? 'drop-shadow-[0_3px_6px_rgba(49,93,255,0.14)]' : ''}
      />
      <span className={`text-xs ${active ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>
    </Link>
  )
}
