'use client'

import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  House,
  Landmark,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'

type ManagerRootBottomNavProps = {
  active: 'home' | 'buildings' | 'tasks' | 'agenda' | 'supervision'
}

export default function ManagerRootBottomNav({
  active,
}: ManagerRootBottomNavProps) {
  const items = [
    {
      id: 'home' as const,
      href: '/manager',
      label: 'Inicio',
      icon: <House size={22} />,
    },
    {
      id: 'tasks' as const,
      href: '/manager/tasks',
      label: 'Tareas',
      icon: <ClipboardList size={22} />,
    },
    {
      id: 'supervision' as const,
      href: '/manager/supervision',
      label: 'Supervisión',
      icon: <BarChart3 size={22} />,
    },
    {
      id: 'buildings' as const,
      href: '/manager/buildings',
      label: 'Edificios',
      icon: <Landmark size={22} />,
    },
    {
      id: 'agenda' as const,
      href: '/manager/agenda',
      label: 'Agenda',
      icon: <CalendarDays size={22} />,
    },
  ]

  return (
    <nav className="shrink-0 border-t border-[#E3EAF3] bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex min-w-[58px] flex-col items-center gap-1 ${
              active === item.id ? 'text-[#2F66C8]' : 'text-[#7B8BA8]'
            }`}
          >
            {item.icon}
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
