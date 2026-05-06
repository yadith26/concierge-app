'use client'

type ManagerRecordsEmptyStateProps = {
  title: string
  description: string
}

export default function ManagerRecordsEmptyState({
  title,
  description,
}: ManagerRecordsEmptyStateProps) {
  return (
    <section className="rounded-[28px] border border-[#E7EDF5] bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <h2 className="text-xl font-semibold text-[#142952]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#6E7F9D]">{description}</p>
    </section>
  )
}
