import type { ReactNode } from 'react'

type AgendaTaskGroupSectionProps = {
  title: string
  count: number
  children: ReactNode
}

export default function AgendaTaskGroupSection({
  title,
  count,
  children,
}: AgendaTaskGroupSectionProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3 px-1">
        <h3 className="text-[15px] font-bold uppercase tracking-[0.05em] text-[#7B86A8]">
          {title}
        </h3>
        <span className="inline-flex min-w-9 items-center justify-center rounded-full border border-[#DCE7F5] bg-white px-2.5 py-1 text-[14px] font-semibold text-[#4D66DA] shadow-[0_6px_18px_rgba(20,41,82,0.04)]">
          {count}
        </span>
      </div>
      {children}
    </section>
  )
}
