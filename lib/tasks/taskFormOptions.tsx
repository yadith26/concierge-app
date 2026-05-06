import {
  Sparkles,
  Wrench,
  Bug,
  Paintbrush,
  ClipboardCheck,
  Truck,
  Repeat,
  Users,
  MoreHorizontal,
} from 'lucide-react'
import type {
  PestTarget,
  TaskCategory,
  TaskPriority,
  TreatmentVisitType,
} from '@/lib/tasks/taskTypes'

export const categoryOptions: {
  value: TaskCategory
  labelKey: string
  icon: React.ReactNode
}[] = [
  {
    value: 'cleaning',
    labelKey: 'category.cleaning',
    icon: <Sparkles className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'repair',
    labelKey: 'category.repair',
    icon: <Wrench className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'pest',
    labelKey: 'category.pest',
    icon: <Bug className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'paint',
    labelKey: 'category.paint',
    icon: <Paintbrush className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'visit',
    labelKey: 'category.visit',
    icon: <Users className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'change',
    labelKey: 'category.change',
    icon: <Repeat className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'delivery',
    labelKey: 'category.delivery',
    icon: <Truck className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'inspection',
    labelKey: 'category.inspection',
    icon: <ClipboardCheck className="h-4 w-4 text-[#60739A]" />,
  },
  {
    value: 'other',
    labelKey: 'category.other',
    icon: <MoreHorizontal className="h-4 w-4 text-[#60739A]" />,
  },
]

export const priorityOptions: {
  value: TaskPriority
  labelKey: string
}[] = [
  { value: 'high', labelKey: 'priority.high' },
  { value: 'medium', labelKey: 'priority.medium' },
  { value: 'low', labelKey: 'priority.low' },
]

export const visitTypeOptions: {
  value: TreatmentVisitType
  labelKey: string
}[] = [
  { value: 'nuevo', labelKey: 'visitType.nuevo' },
  { value: 'seguimiento', labelKey: 'visitType.seguimiento' },
  { value: 'preventivo', labelKey: 'visitType.preventivo' },
]

export const pestTargetOptions: {
  value: PestTarget
  labelKey: string
}[] = [
  { value: 'cucarachas', labelKey: 'pestTarget.cucarachas' },
  { value: 'roedores', labelKey: 'pestTarget.roedores' },
  { value: 'chinches', labelKey: 'pestTarget.chinches' },
]
