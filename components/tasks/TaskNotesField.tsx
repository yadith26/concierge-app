'use client'

type TaskNotesFieldProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  rows?: number
}

export default function TaskNotesField({
  value,
  onChange,
  label = 'Nota',
  placeholder = 'Detalles adicionales...',
  rows = 4,
}: TaskNotesFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] outline-none transition placeholder:text-[#8C9AB3] focus:border-[#BCD1F3] focus:ring-2 focus:ring-[#EAF2FF]"
      />
    </div>
  )
}