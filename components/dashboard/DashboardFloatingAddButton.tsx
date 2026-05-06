'use client'

import { Plus } from 'lucide-react'

type DashboardFloatingAddButtonProps = {
  onClick: () => void
}

export default function DashboardFloatingAddButton({
  onClick,
}: DashboardFloatingAddButtonProps) {
  return (
    <div className="pointer-events-none absolute bottom-24 right-5 z-50">
      <div className="pointer-events-auto group">
        <button
          onClick={onClick}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2F66C8] text-white shadow-[0_14px_30px_rgba(47,102,200,0.32)] transition hover:scale-105 hover:bg-[#2859B2]"
          aria-label="Agregar tarea"
          title="Agregar tarea"
        >
          <Plus size={30} />
        </button>

        <div className="pointer-events-none absolute right-20 top-1/2 hidden -translate-y-1/2 rounded-xl bg-[#142952] px-3 py-2 text-sm text-white opacity-0 shadow-md transition group-hover:opacity-100 md:block">
          Agregar tarea
        </div>
      </div>
    </div>
  )
}