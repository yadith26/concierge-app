'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { categoryOptions, priorityOptions } from '@/lib/tasks/taskFormOptions'
import type { TaskCategory, TaskPriority } from '@/lib/tasks/taskTypes'

type TaskCategoryPriorityFieldsProps = {
  category: TaskCategory | ''
  priority: TaskPriority
  onCategoryChange: (value: TaskCategory | '') => void
  onPriorityChange: (value: TaskPriority) => void
}

export default function TaskCategoryPriorityFields({
  category,
  priority,
  onCategoryChange,
  onPriorityChange,
}: TaskCategoryPriorityFieldsProps) {
  const t = useTranslations('taskLabels')
  const uiT = useTranslations('taskCategoryPriorityFields')

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)

  const categoryRef = useRef<HTMLDivElement | null>(null)
  const priorityRef = useRef<HTMLDivElement | null>(null)

  const selectedCategory =
    categoryOptions.find((option) => option.value === category) || null

  const selectedPriority =
    priorityOptions.find((option) => option.value === priority) ||
    priorityOptions[1]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node

      if (categoryRef.current && !categoryRef.current.contains(target)) {
        setCategoryOpen(false)
      }

      if (priorityRef.current && !priorityRef.current.contains(target)) {
        setPriorityOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {uiT('category')}
        </label>

        <div className="relative" ref={categoryRef}>
          <button
            type="button"
            onClick={() => {
              setCategoryOpen((prev) => !prev)
              setPriorityOpen(false)
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] shadow-sm"
          >
            <span className="flex items-center gap-3">
              {selectedCategory ? (
                <>
                  {selectedCategory.icon}
                  {t(selectedCategory.labelKey)}
                </>
              ) : (
                <span className="text-[#8C9AB3]">Selecciona categoria</span>
              )}
            </span>

            <ChevronDown
              size={20}
              className={`text-[#8C9AB3] transition ${
                categoryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {categoryOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white shadow-[0_12px_30px_rgba(20,41,82,0.10)]">
              {categoryOptions.map((option) => {
                const selected = category === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onCategoryChange(option.value)
                      setCategoryOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-[#5E6E8C] transition ${
                      selected ? 'bg-[#F3F7FD]' : 'hover:bg-[#F8FAFE]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {option.icon}
                      <span className="text-base font-medium">
                        {t(option.labelKey)}
                      </span>
                    </span>

                    {selected && <Check className="h-4 w-4 text-[#2F66C8]" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-[#5E6E8C]">
          {uiT('priority')}
        </label>

        <div className="relative" ref={priorityRef}>
          <button
            type="button"
            onClick={() => {
              setPriorityOpen((prev) => !prev)
              setCategoryOpen(false)
            }}
            className="flex w-full items-center justify-between rounded-2xl border border-[#E7EDF5] bg-white px-4 py-4 text-base text-[#142952] shadow-sm"
          >
            <span>{t(selectedPriority.labelKey)}</span>

            <ChevronDown
              size={20}
              className={`text-[#8C9AB3] transition ${
                priorityOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {priorityOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-[#E7EDF5] bg-white shadow-[0_12px_30px_rgba(20,41,82,0.10)]">
              {priorityOptions.map((option) => {
                const selected = priority === option.value

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onPriorityChange(option.value)
                      setPriorityOpen(false)
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-[#5E6E8C] transition ${
                      selected ? 'bg-[#F3F7FD]' : 'hover:bg-[#F8FAFE]'
                    }`}
                  >
                    <span className="text-base font-medium">
                      {t(option.labelKey)}
                    </span>

                    {selected && <Check className="h-4 w-4 text-[#2F66C8]" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
