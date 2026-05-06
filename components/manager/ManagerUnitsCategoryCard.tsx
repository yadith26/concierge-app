'use client'

import type { ReactNode } from 'react'

type ManagerUnitsCategoryCardProps = {
  title: string
  subtitle: string
  icon: ReactNode
  active: boolean
  onClick: () => void
}

export default function ManagerUnitsCategoryCard({
  title,
  subtitle,
  icon,
  active,
  onClick,
}: ManagerUnitsCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[26px] border px-4 py-5 text-left shadow-[0_8px_24px_rgba(20,41,82,0.05)] transition ${
        active
          ? 'border-[#CFE0FF] bg-[#EEF4FF]'
          : 'border-[#E7EDF5] bg-white hover:bg-[#FBFCFE]'
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full ${
          active ? 'bg-white text-[#2F66C8]' : 'bg-[#F3F6FB] text-[#8C9AB3]'
        }`}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-[18px] font-bold text-[#142952]">{title}</h2>
      <p className="mt-1 text-sm text-[#7B8BA8]">{subtitle}</p>
    </button>
  )
}
