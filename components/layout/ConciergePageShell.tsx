'use client'

import type { ReactNode } from 'react'

type ConciergePageShellProps = {
  loading?: boolean
  loadingLabel: string
  children: ReactNode
  bottomNav?: ReactNode
}

export default function ConciergePageShell({
  loading = false,
  loadingLabel,
  children,
  bottomNav,
}: ConciergePageShellProps) {
  if (loading) {
    return (
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md items-center justify-center bg-[#F6F8FC]">
          <p className="text-[#6E7F9D]">{loadingLabel}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-[#F6F8FC]">
      <div className="relative mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
        {children}
        {bottomNav}
      </div>
    </main>
  )
}
