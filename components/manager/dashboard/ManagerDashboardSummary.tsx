'use client'

type ManagerDashboardSummaryProps = {
  summary: {
    urgent: number
    pending: number
    completed: number
    today: number
    overdue: number
    upcoming: number
  }
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export default function ManagerDashboardSummary({
  summary,
  activeFilter,
  onFilterChange,
}: ManagerDashboardSummaryProps) {
  function getCardClasses(filter: string) {
    return `flex-1 rounded-2xl px-4 py-4 text-center transition ${
      activeFilter === filter
        ? 'bg-[#2F66C8] text-white'
        : 'bg-white text-[#142952] border border-[#E3EAF3]'
    }`
  }

  return (
    <div className="space-y-3">

      {/* 🔥 FILA 1 */}
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange('urgent')}
          className={getCardClasses('urgent')}
        >
          <p className="text-xs">Urgentes</p>
          <p className="text-xl font-bold">{summary.urgent}</p>
        </button>

        <button
          onClick={() => onFilterChange('pending')}
          className={getCardClasses('pending')}
        >
          <p className="text-xs">Pendientes</p>
          <p className="text-xl font-bold">{summary.pending}</p>
        </button>

        <button
          onClick={() => onFilterChange('completed')}
          className={getCardClasses('completed')}
        >
          <p className="text-xs">Completadas</p>
          <p className="text-xl font-bold">{summary.completed}</p>
        </button>
      </div>

      {/* 🔥 FILA 2 (LAS IMPORTANTES) */}
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange('today')}
          className={getCardClasses('today')}
        >
          <p className="text-xs">Hoy</p>
          <p className="text-xl font-bold">{summary.today}</p>
        </button>

        <button
          onClick={() => onFilterChange('overdue')}
          className={getCardClasses('overdue')}
        >
          <p className="text-xs">Atrasadas</p>
          <p className="text-xl font-bold">{summary.overdue}</p>
        </button>

        <button
          onClick={() => onFilterChange('upcoming')}
          className={getCardClasses('upcoming')}
        >
          <p className="text-xs">Próximas</p>
          <p className="text-xl font-bold">{summary.upcoming}</p>
        </button>
      </div>

    </div>
  )
}