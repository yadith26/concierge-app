'use client'

import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation'
import {
  ClipboardList,
  House,
  Calendar,
  Package,
  Shield,
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

        <Link
          href={withBuilding('/dashboard')}
          className={`flex min-w-[64px] flex-col items-center gap-1 ${
            active === 'dashboard'
              ? 'text-[#2F66C8]'
              : 'text-[#7B8BA8]'
          }`}
        >
          <House size={24} />
          <span className="text-xs">{t('home')}</span>
        </Link>

        <Link
          href={withBuilding('/tasks')}
          className={`flex min-w-[64px] flex-col items-center gap-1 ${
            active === 'tasks'
              ? 'text-[#2F66C8]'
              : 'text-[#7B8BA8]'
          }`}
        >
          <ClipboardList size={24} />
          <span className="text-xs">{t('tasks')}</span>
        </Link>

        <Link
          href={withBuilding('/inventory')}
          className={`flex min-w-[64px] flex-col items-center gap-1 ${
            active === 'inventory'
              ? 'text-[#2F66C8]'
              : 'text-[#7B8BA8]'
          }`}
        >
          <Package size={24} />
          <span className="text-xs">{t('inventory')}</span>
        </Link>

        <Link
          href={withBuilding('/treatments')}
          className={`flex min-w-[64px] flex-col items-center gap-1 ${
            active === 'treatments'
              ? 'text-[#2F66C8]'
              : 'text-[#7B8BA8]'
          }`}
        >
          <Shield size={24} />
          <span className="text-xs">{t('treatments')}</span>
        </Link>

        <Link
          href={withBuilding('/agenda')}
          className={`flex min-w-[64px] flex-col items-center gap-1 ${
            active === 'agenda'
              ? 'text-[#2F66C8]'
              : 'text-[#7B8BA8]'
          }`}
        >
          <Calendar size={24} />
          <span className="text-xs">{t('agenda')}</span>
        </Link>

      </div>
    </nav>
  )
}
