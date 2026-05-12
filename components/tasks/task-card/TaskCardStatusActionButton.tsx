'use client'

type TaskCardStatusActionButtonProps = {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}

export default function TaskCardStatusActionButton({
  label,
  active,
  disabled = false,
  onClick,
}: TaskCardStatusActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (disabled) return
        onClick()
      }}
      className={`w-full rounded-full border px-2 py-2.5 text-center text-xs font-semibold transition sm:text-sm ${
        active
          ? 'border-[#DCE7F5] bg-[#EEF4FF] text-[#2F66C8]'
          : 'border-[#E7EDF5] bg-white text-[#5E6E8C] hover:bg-[#F8FAFE]'
      } ${disabled ? 'cursor-not-allowed opacity-55 hover:bg-white' : ''}`}
    >
      {label}
    </button>
  )
}
