import type { PestTarget, TreatmentVisitType } from '@/lib/tasks/taskTypes'

function formatDate(
  value: string,
  locale: string,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value))
}

export function formatDateShort(date: string, locale: string) {
  return formatDate(`${date}T12:00:00`, locale, {
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateLong(date: string, locale: string) {
  return formatDate(`${date}T12:00:00`, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(value: string, locale: string) {
  return formatDate(value, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getPestStyles(type: PestTarget) {
  if (type === 'cucarachas') {
    return {
      chip: 'bg-[#FFF3E8] text-[#AD6A00]',
    }
  }

  if (type === 'roedores') {
    return {
      chip: 'bg-[#EEF4FF] text-[#2F66C8]',
    }
  }

  return {
    chip: 'bg-[#FFF4F5] text-[#D64555]',
  }
}

export function getVisitStyles(type: TreatmentVisitType | null) {
  if (type === 'nuevo') {
    return {
      chip: 'bg-[#EEF4FF] text-[#2F66C8]',
    }
  }

  if (type === 'seguimiento') {
    return {
      chip: 'bg-[#F3EEFF] text-[#7A5AC7]',
    }
  }

  return {
    chip: 'bg-[#EAF7F0] text-[#177B52]',
  }
}