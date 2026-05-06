'use client'

import { MessageSquare, UserRound } from 'lucide-react'

type ManagerConciergeContactCardProps = {
  conciergeName: string
  disabled?: boolean
  onClick: () => void
}

export default function ManagerConciergeContactCard({
  conciergeName,
  disabled = false,
  onClick,
}: ManagerConciergeContactCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mt-3 flex w-full items-center justify-between rounded-[24px] border px-4 py-4 text-left shadow-[0_8px_24px_rgba(20,41,82,0.05)] transition ${
        disabled
          ? 'cursor-not-allowed border-[#E7EDF5] bg-white/70 opacity-70'
          : 'border-[#E7EDF5] bg-white hover:border-[#C7D8F5] hover:bg-[#FBFCFF]'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F6FB] text-[#8C9AB3]">
          <UserRound size={18} />
        </span>

        <span className="min-w-0">
          <span className="block text-sm font-medium text-[#8C9AB3]">
            Conserje
          </span>
          <span className="block truncate text-[15px] font-bold text-[#142952]">
            {conciergeName}
          </span>
        </span>
      </div>

      <span className="inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-2 text-xs font-semibold text-[#2F66C8]">
        <MessageSquare size={15} />
        Mensaje
      </span>
    </button>
  )
}
