'use client'

import type { ReactNode } from 'react'

type TaskCardDetailRowProps = {
  icon: ReactNode
  label: string
  value: string
}

export default function TaskCardDetailRow({
  icon,
  label,
  value,
}: TaskCardDetailRowProps) {
  return (
    <div className="rounded-2xl bg-[#F9FBFE] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-[#7B8BA8]">{icon}</div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#8C9AB3]">
            {label}
          </p>

          <p className="mt-0.5 break-words text-sm font-medium text-[#142952]">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}