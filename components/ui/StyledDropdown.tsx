'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type StyledDropdownOption = {
  value: string
  label: string
  icon?: ReactNode
}

type StyledDropdownProps = {
  label?: string
  ariaLabel: string
  value: string
  options: StyledDropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  buttonClassName?: string
  menuClassName?: string
  zIndexClassName?: string
}

export default function StyledDropdown({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  placeholder = '',
  buttonClassName = '',
  menuClassName = '',
  zIndexClassName = 'z-20',
}: StyledDropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  )

  return (
    <div className="relative" ref={rootRef}>
      {label ? (
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {label}
        </label>
      ) : null}

      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-left text-base text-[#142952] shadow-sm ${buttonClassName}`.trim()}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selectedOption?.icon ? (
            <span className="shrink-0 text-[#60739A]">{selectedOption.icon}</span>
          ) : null}
          <span
            className={
              selectedOption ? 'truncate text-[#142952]' : 'truncate text-[#8C9AB3]'
            }
          >
            {selectedOption?.label || placeholder}
          </span>
        </span>

        <ChevronDown
          size={20}
          className={`shrink-0 text-[#8C9AB3] transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+8px)] ${zIndexClassName} overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white shadow-[0_12px_30px_rgba(20,41,82,0.10)] ${menuClassName}`.trim()}
        >
          <div className="max-h-72 overflow-y-auto py-1">
            {options.map((option) => {
              const selected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                    selected ? 'bg-[#EEF4FF] text-[#2F66C8]' : 'text-[#5E6E8C] hover:bg-[#F8FAFE]'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {option.icon ? (
                      <span className="shrink-0 text-[#60739A]">{option.icon}</span>
                    ) : null}
                    <span className="truncate text-base font-medium">{option.label}</span>
                  </span>

                  {selected ? <Check className="h-4 w-4 text-[#2F66C8]" /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
