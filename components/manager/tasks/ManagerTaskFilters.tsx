type Props = {
  activeFilter: string
  onChange: (filter: any) => void
}

export default function ManagerTaskFilters({
  activeFilter,
  onChange,
}: Props) {
  const filters = [
    { key: 'today', label: 'Hoy' },
    { key: 'overdue', label: 'Atrasadas' },
    { key: 'upcoming', label: 'Próximas' },
    { key: 'all', label: 'Todas' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
            activeFilter === f.key
              ? 'bg-[#2F66C8] text-white'
              : 'bg-white border border-[#E3EAF3] text-[#142952]'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}