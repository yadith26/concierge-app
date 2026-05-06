import type { ReactNode } from 'react'
import type { TaskCategory } from '@/lib/tasks/taskTypes'
import {
  Bug,
  ClipboardCheck,
  Paintbrush,
  Repeat,
  Sparkles,
  Tag,
  Truck,
  Users,
  Wrench,
} from 'lucide-react'

type OwnerRequestStatus = 'pending' | 'viewed' | 'converted' | 'closed'
type TranslateFn = (key: string) => string

export function getEventCategories(t: TranslateFn): {
  value: TaskCategory
  label: string
  icon: ReactNode
}[] {
  return [
    { value: 'visit', label: t('eventCategory.visit'), icon: <Users size={18} /> },
    { value: 'change', label: t('eventCategory.change'), icon: <Repeat size={18} /> },
    { value: 'delivery', label: t('eventCategory.delivery'), icon: <Truck size={18} /> },
    {
      value: 'inspection',
      label: t('eventCategory.inspection'),
      icon: <ClipboardCheck size={18} />,
    },
    { value: 'repair', label: t('eventCategory.repair'), icon: <Wrench size={18} /> },
    {
      value: 'cleaning',
      label: t('eventCategory.cleaning'),
      icon: <Sparkles size={18} />,
    },
    { value: 'paint', label: t('eventCategory.paint'), icon: <Paintbrush size={18} /> },
    { value: 'pest', label: t('eventCategory.pest'), icon: <Bug size={18} /> },
    { value: 'other', label: t('eventCategory.other'), icon: <Tag size={18} /> },
  ]
}

export function getEventStatusLabel(
  status: OwnerRequestStatus,
  t: TranslateFn
) {
  if (status === 'viewed') return t('eventStatus.viewed')
  if (status === 'converted') return t('eventStatus.converted')
  if (status === 'closed') return t('eventStatus.closed')
  return t('eventStatus.pending')
}

export function getManagerAgendaCategoryLabel(
  category: TaskCategory,
  t: TranslateFn
) {
  if (category === 'change') return t('eventCategory.change')
  if (category === 'delivery') return t('eventCategory.delivery')
  if (category === 'visit') return t('eventCategory.visit')
  if (category === 'inspection') return t('eventCategory.inspection')
  if (category === 'repair') return t('eventCategory.repair')
  if (category === 'cleaning') return t('eventCategory.cleaning')
  if (category === 'paint') return t('eventCategory.paint')
  if (category === 'pest') return t('eventCategory.pest')
  return t('eventCategory.other')
}
