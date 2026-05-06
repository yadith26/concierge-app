'use client'

import { Calendar, ClipboardList, House, LayoutGrid } from 'lucide-react'
import { Link } from '@/i18n/navigation'

type ManagerBottomNavProps = {
  buildingId: string
  active: 'home' | 'agenda' | 'units' | 'records'
}

export default function ManagerBottomNav({
  buildingId,
  active,
}: ManagerBottomNavProps) {
  const items = [
    {
      id: 'home' as const,
      href: `/manager/buildings/${buildingId}`,
      label: 'Dashboard',
      icon: <House size={22} />,
    },
    {
      id: 'agenda' as const,
      href: `/manager/buildings/${buildingId}/agenda`,
      label: 'Agenda',
      icon: <Calendar size={22} />,
    },
    {
      id: 'units' as const,
      href: `/manager/buildings/${buildingId}/units`,
      label: 'Unidades',
      icon: <LayoutGrid size={22} />,
    },
    {
      id: 'records' as const,
      href: `/manager/buildings/${buildingId}/records`,
      label: 'Records',
      icon: <ClipboardList size={22} />,
    },
  ]

  return (
    <nav className="shrink-0 border-t border-[#E3EAF3] bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex min-w-[72px] flex-col items-center gap-1 ${
              active === item.id ? 'text-[#2F66C8]' : 'text-[#7B8BA8]'
            }`}
          >
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
