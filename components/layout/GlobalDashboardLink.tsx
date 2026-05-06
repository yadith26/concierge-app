'use client'

import { Grid3X3 } from 'lucide-react'
import { Link } from '@/i18n/navigation'

type GlobalDashboardLinkProps = {
  href: string
  label?: string
  size?: 'default' | 'compact'
}

export default function GlobalDashboardLink({
  href,
  label = 'Vista general',
  size = 'default',
}: GlobalDashboardLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-[#DCE7F5] bg-white/92 font-bold text-[#2F66C8] shadow-[0_8px_24px_rgba(20,41,82,0.06)] transition hover:bg-[#F8FBFF] ${
        size === 'compact' ? 'px-3 py-2.5 text-[13px]' : 'px-4 py-2.5 text-sm'
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-full bg-[#EEF4FF] ${
          size === 'compact' ? 'h-7 w-7' : 'h-7 w-7'
        }`}
      >
        <Grid3X3 size={size === 'compact' ? 14 : 15} />
      </span>
      {label}
    </Link>
  )
}
