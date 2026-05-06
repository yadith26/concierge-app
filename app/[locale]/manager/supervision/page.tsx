'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  MessageSquareMore,
  TimerReset,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import {
  fetchBuildingsForUser,
} from '@/lib/buildings/buildingMembershipService'
import {
  fetchManagerSupervisionData,
  type BuildingSupervisionSummary,
  type SupervisionTreatment,
} from '@/lib/manager/supervisionService'
import { exportSupervisionToExcel } from '@/lib/manager/exportSupervision'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerRootBottomNav from '@/components/layout/ManagerRootBottomNav'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import { getPestTargetKey, getVisitTypeKey } from '@/lib/tasks/taskLabels'

export default function ManagerSupervisionPage() {
  const router = useRouter()
  const locale = useLocale()
  const headerConversation = useHeaderConversation()
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)

  const [summaries, setSummaries] = useState<BuildingSupervisionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadSupervision = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
      error: userError,
    } = await getSafeAuthUser()

    if (userError || !user) {
      router.replace('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      setErrorMessage('No se pudo cargar tu perfil.')
      setLoading(false)
      return
    }

    if (profile.role !== 'manager') {
      router.replace('/dashboard')
      return
    }

    try {
      const nextBuildings = await fetchBuildingsForUser({
        userId: profile.id,
        role: 'manager',
      })
      const nextSummaries = await fetchManagerSupervisionData(nextBuildings)

      setSummaries(nextSummaries)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la supervision.'
      )
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void loadSupervision()
  }, [loadSupervision])

  const executiveStats = useMemo(() => {
    const totalTasks = summaries.reduce(
      (total, summary) => total + summary.totalMonthTasks,
      0
    )
    const completedTasks = summaries.reduce(
      (total, summary) => total + summary.completedMonthTasks,
      0
    )
    const overdueTasks = summaries.reduce(
      (total, summary) => total + summary.overdueTasks,
      0
    )
    const alerts = summaries.reduce(
      (total, summary) => total + summary.alerts.length,
      0
    )

    return {
      completionRate:
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      overdueTasks,
      alerts,
    }
  }, [summaries])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
          <p className="text-[#6E7F9D]">Cargando supervision...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <ManagerHeader
            compact={compactHeader}
            title="Supervisión"
            subtitle="Estado operativo de tus edificios"
            flatBottom
            secondaryAction={
              headerConversation.canOpenConversation
                ? {
                    icon: <MessageSquareMore size={compactHeader ? 19 : 24} />,
                    label: 'Abrir mensajes',
                    count: headerConversation.unreadCount,
                    onClick: () => {
                      void headerConversation.openInbox()
                    },
                  }
                : null
            }
            headerContent={
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <ExecutiveMetricCard
                    label="Completado"
                    value={`${executiveStats.completionRate}%`}
                    tone="green"
                  />
                  <ExecutiveMetricCard
                    label="Atrasadas"
                    value={executiveStats.overdueTasks.toString()}
                    tone={executiveStats.overdueTasks > 0 ? 'red' : 'green'}
                  />
                  <ExecutiveMetricCard
                    label="Alertas"
                    value={executiveStats.alerts.toString()}
                    tone={executiveStats.alerts > 0 ? 'yellow' : 'green'}
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void exportSupervisionToExcel({
                      summaries,
                      locale,
                    })
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[#2F66C8] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(47,102,200,0.24)]"
                >
                  <Download size={18} />
                  Exportar supervisión
                </button>
              </div>
            }
          />

          <section
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-5 pb-36 pt-5"
          >
            {errorMessage ? (
              <div className="mb-4 rounded-3xl border border-[#F1D3D3] bg-[#FFF5F5] px-5 py-4 text-sm font-medium text-[#C53030]">
                {errorMessage}
              </div>
            ) : null}

            {!errorMessage ? (
              <div className="space-y-5">
                <section>
                  <h2 className="text-[22px] font-extrabold text-[#142952]">
                    Estado por edificio
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#6E7F9D]">
                    Resumen del mes actual, tareas atrasadas y tratamientos
                    recientes.
                  </p>
                </section>

                {summaries.length > 0 ? (
                  summaries.map((summary) => (
                    <SupervisionBuildingCard
                      key={summary.building.id}
                      locale={locale}
                      summary={summary}
                      onOpenBuilding={() =>
                        router.push(`/manager/buildings/${summary.building.id}`)
                      }
                      onOpenRecords={() =>
                        router.push(
                          `/manager/buildings/${summary.building.id}/records`
                        )
                      }
                      onOpenUnit={(unitKey) =>
                        router.push(
                          `/manager/buildings/${summary.building.id}/units/${unitKey}`
                        )
                      }
                    />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-[#E3EAF3] bg-white p-6 text-sm leading-6 text-[#6E7F9D] shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
                    Todavia no tienes edificios para supervisar.
                  </div>
                )}
              </div>
            ) : null}
          </section>

          <ManagerRootBottomNav active="supervision" />
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title="Mensajes"
        subtitle={headerConversation.contactName || 'Sin contacto asignado'}
        currentUserId={headerConversation.currentUserId}
        messages={headerConversation.messages}
        value={headerConversation.value}
        sending={headerConversation.sending}
        loading={headerConversation.loadingConversation}
        error={headerConversation.error}
        onChange={headerConversation.setValue}
        onClose={headerConversation.closeConversation}
        onSubmit={() => {
          void headerConversation.sendMessage()
        }}
      />

      <GlobalMessagesInboxModal
        open={headerConversation.inboxOpen}
        conversations={headerConversation.inboxConversations}
        loading={headerConversation.loadingInbox}
        onClose={headerConversation.closeInbox}
        onSelect={(conversation) => {
          void headerConversation.openInboxConversation(conversation)
        }}
      />
    </>
  )
}

function ExecutiveMetricCard({
  label,
  tone,
  value,
}: {
  label: string
  tone: 'green' | 'red' | 'yellow'
  value: string
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-[#EAF8EF] text-[#177B52]'
      : tone === 'red'
        ? 'bg-[#FFF1F2] text-[#C53030]'
        : 'bg-[#FFF7DF] text-[#9A6700]'

  return (
    <div className={`rounded-[22px] px-3 py-4 text-center ${toneClass}`}>
      <p className="text-[22px] font-extrabold leading-none">{value}</p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em]">
        {label}
      </p>
    </div>
  )
}

function SupervisionBuildingCard({
  locale,
  onOpenBuilding,
  onOpenRecords,
  onOpenUnit,
  summary,
}: {
  locale: string
  onOpenBuilding: () => void
  onOpenRecords: () => void
  onOpenUnit: (unitKey: string) => void
  summary: BuildingSupervisionSummary
}) {
  const severity = getBuildingSeverity(summary)
  const severityClass =
    severity === 'red'
      ? 'border-[#F0B9C0] bg-[#FFF7F8]'
      : severity === 'yellow'
        ? 'border-[#F4D7A6] bg-[#FFFDF7]'
        : 'border-[#DCEEDD] bg-white'

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpenBuilding}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpenBuilding()
      }}
      className={`rounded-[30px] border p-5 shadow-[0_12px_30px_rgba(20,41,82,0.07)] transition hover:-translate-y-0.5 ${severityClass}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-[#EEF4FF] text-[#2F66C8]">
          <BarChart3 size={30} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[21px] font-extrabold text-[#142952]">
            {summary.building.name}
          </h3>
          <p className="mt-1 truncate text-sm text-[#6E7F9D]">
            {summary.building.address || 'Sin direccion registrada'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniMetric
          icon={<CheckCircle2 size={17} />}
          label="Completado"
          value={`${summary.completionRate}%`}
        />
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onOpenBuilding()
          }}
          className="text-left"
        >
          <MiniMetric
            icon={<TimerReset size={17} />}
            label="Atrasadas"
            value={summary.overdueTasks.toString()}
            tone={summary.overdueTasks > 0 ? 'red' : 'neutral'}
          />
        </button>
        <MiniMetric
          icon={<TimerReset size={17} />}
          label="Hoy"
          value={summary.todayTasks.toString()}
        />
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          if (summary.latestTreatment) onOpenRecords()
        }}
        className="mt-5 w-full rounded-[24px] bg-[#F8FAFE] px-4 py-4 text-left transition hover:bg-[#EEF4FF]"
      >
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#8C9AB3]">
          Ultimo tratamiento
        </p>
        {summary.latestTreatment ? (
          <p className="mt-2 text-sm font-semibold leading-6 text-[#142952]">
            {formatTreatment(summary.latestTreatment, locale)}
          </p>
        ) : (
          <p className="mt-2 text-sm font-semibold text-[#6E7F9D]">
            Sin tratamientos recientes
          </p>
        )}
      </button>

      {summary.alerts.length > 0 ? (
        <div className="mt-4 space-y-2">
          {summary.alerts.slice(0, 2).map((alert) => (
            <button
              key={`${alert.buildingId}-${alert.apartmentOrArea}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                if (alert.apartmentKey) {
                  onOpenUnit(alert.apartmentKey)
                } else {
                  onOpenRecords()
                }
              }}
              className="flex items-start gap-3 rounded-[22px] border border-[#F4D7A6] bg-[#FFF8EA] px-4 py-3 text-[#9A6700]"
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-semibold leading-6">
                {alert.apartmentOrArea} con {alert.count} tratamientos recientes
              </p>
            </button>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function MiniMetric({
  icon,
  label,
  tone = 'neutral',
  value,
}: {
  icon: React.ReactNode
  label: string
  tone?: 'neutral' | 'red'
  value: string
}) {
  const toneClass =
    tone === 'red'
      ? 'bg-[#FFF1F2] text-[#C53030]'
      : 'bg-[#F8FAFE] text-[#142952]'

  return (
    <div className={`rounded-[22px] px-3 py-4 ${toneClass}`}>
      <div className="flex items-center gap-2 text-[#6E7F9D]">{icon}</div>
      <p className="mt-3 text-[22px] font-extrabold leading-none">
        {value}
      </p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8C9AB3]">
        {label}
      </p>
    </div>
  )
}

function getBuildingSeverity(summary: BuildingSupervisionSummary) {
  if (summary.alerts.length > 0 || summary.overdueTasks >= 5) return 'red'
  if (summary.overdueTasks > 0 || summary.completionRate < 70) return 'yellow'
  return 'green'
}

function formatTreatment(treatment: SupervisionTreatment, locale: string) {
  const pest = treatment.pest_target
    ? getSpanishPestLabel(treatment.pest_target)
    : 'Plagas'
  const visitType = treatment.treatment_visit_type
    ? getSpanishVisitLabel(treatment.treatment_visit_type)
    : 'Tratamiento'
  const date = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${treatment.treatment_date}T12:00:00`))

  return `${treatment.apartment_or_area} · ${pest} · ${visitType} · ${date}`
}

function getSpanishPestLabel(pest: NonNullable<SupervisionTreatment['pest_target']>) {
  const key = getPestTargetKey(pest)
  if (key.endsWith('cucarachas')) return 'Cucarachas'
  if (key.endsWith('roedores')) return 'Roedores'
  return 'Chinches'
}

function getSpanishVisitLabel(
  visitType: NonNullable<SupervisionTreatment['treatment_visit_type']>
) {
  const key = getVisitTypeKey(visitType)
  if (key.endsWith('seguimiento')) return 'Seguimiento'
  if (key.endsWith('preventivo')) return 'Preventivo'
  return 'Inicial'
}
