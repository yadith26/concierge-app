'use client'

import type { ReactNode } from 'react'

type InventoryDetailRowProps = {
  icon: ReactNode
  label: string
  value: string
}

export default function InventoryDetailRow({
  icon,
  label,
  value,
}: InventoryDetailRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[#F9FBFE] px-4 py-3">
      <div className="mt-0.5 text-[#7B8BA8] [&_svg]:h-4.5 [&_svg]:w-4.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#8C9AB3]">
          {label}
        </p>
        <p className="whitespace-pre-wrap break-words text-[15px] font-medium text-[#142952]">
          {value}
        </p>
      </div>
    </div>
  )
}
