'use client'

type TaskCardStatusActionButtonProps = {
  label: string
  active: boolean
  onClick: () => void
}

export default function TaskCardStatusActionButton({
  label,
  active,
  onClick,
}: TaskCardStatusActionButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`w-full rounded-full border px-2 py-2.5 text-center text-xs font-semibold transition sm:text-sm ${
        active
          ? 'border-[#DCE7F5] bg-[#EEF4FF] text-[#2F66C8]'
          : 'border-[#E7EDF5] bg-white text-[#5E6E8C] hover:bg-[#F8FAFE]'
      }`}
    >
      {label}
    </button>
  )
}
