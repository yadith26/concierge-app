'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Building2,
  Car,
  ChevronRight,
  Copy,
  Home,
  KeyRound,
  Link2,
  MapPin,
  MessageSquareMore,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  SlidersHorizontal,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import { useLocale } from 'next-intl'
import Image from 'next/image'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import {
  connectBuildingByCode,
  createBuildingForUser,
  fetchBuildingsForUser,
  unlinkBuildingFromUser,
  type BuildingSummary,
} from '@/lib/buildings/buildingMembershipService'
import ManagerRootBottomNav from '@/components/layout/ManagerRootBottomNav'
import HeaderProfileButton from '@/components/layout/HeaderProfileButton'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

type BuildingFormMode = 'connect' | 'create'

type BuildingPortfolioMetrics = {
  apartmentTotal: number
  occupied: number
  available: number
  garages: number
}

const EMPTY_BUILDING_METRICS: BuildingPortfolioMetrics = {
  apartmentTotal: 0,
  occupied: 0,
  available: 0,
  garages: 0,
}

export default function ManagerBuildingsPage() {
  const router = useRouter()
  const locale = useLocale()
  const headerConversation = useHeaderConversation()
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)
  const manageBuildingsRef = useRef<HTMLElement | null>(null)

  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [buildingMetrics, setBuildingMetrics] = useState<
    Record<string, BuildingPortfolioMetrics>
  >({})
  const [profileId, setProfileId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [newBuildingName, setNewBuildingName] = useState('')
  const [newBuildingAddress, setNewBuildingAddress] = useState('')
  const [createdInviteCode, setCreatedInviteCode] = useState('')
  const [formMode, setFormMode] = useState<BuildingFormMode>('connect')
  const [managePanelOpen, setManagePanelOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [unlinkingBuildingId, setUnlinkingBuildingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [messageTaskDraft, setMessageTaskDraft] = useState<TaskDraft | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [messageTaskModalOpen, setMessageTaskModalOpen] = useState(false)

  useEffect(() => {
    const fetchManagerBuildings = async () => {
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

      setProfileId(profile.id)

      try {
        const nextBuildings = await fetchBuildingsForUser({
          userId: profile.id,
          role: 'manager',
        })
        setBuildings(nextBuildings)
        setBuildingMetrics(await fetchBuildingPortfolioMetrics(nextBuildings))
      } catch {
        setErrorMessage('No se pudieron cargar tus edificios.')
        setLoading(false)
        return
      }

      setLoading(false)
    }

    void fetchManagerBuildings()
  }, [router])

  useEffect(() => {
    if (loading) return
    if (typeof window === 'undefined') return
    if (window.location.hash !== '#manage-buildings') return

    setManagePanelOpen(true)
    requestAnimationFrame(() => {
      manageBuildingsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [loading])

  const handleConnectBuilding = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!profileId) {
      setErrorMessage('No se pudo identificar tu perfil.')
      return
    }

    setConnecting(true)
    setErrorMessage('')

    try {
      const building = await connectBuildingByCode({
        inviteCode,
        userId: profileId,
        role: 'manager',
      })

      setBuildings((prev) =>
        prev.some((item) => item.id === building.id) ? prev : [...prev, building]
      )
      setBuildingMetrics((prev) => ({
        ...prev,
        [building.id]: EMPTY_BUILDING_METRICS,
      }))
      setInviteCode('')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo conectar el edificio.'
      )
    } finally {
      setConnecting(false)
    }
  }

  const handleCreateBuilding = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!profileId) return

    setConnecting(true)
    setErrorMessage('')
    setCreatedInviteCode('')

    try {
      const building = await createBuildingForUser({
        name: newBuildingName,
        address: newBuildingAddress,
        userId: profileId,
        role: 'manager',
      })

      setBuildings((prev) =>
        prev.some((item) => item.id === building.id) ? prev : [...prev, building]
      )
      setBuildingMetrics((prev) => ({
        ...prev,
        [building.id]: EMPTY_BUILDING_METRICS,
      }))
      setNewBuildingName('')
      setNewBuildingAddress('')
      setCreatedInviteCode(building.invite_code || '')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No se pudo crear el edificio.'
      )
    } finally {
      setConnecting(false)
    }
  }

  const handleUnlinkBuilding = async (building: BuildingSummary) => {
    if (!profileId || unlinkingBuildingId) return

    const confirmed = window.confirm(
      `Quieres quitar "${building.name}" de tu lista de edificios? No se borraran las tareas ni el historial del edificio.`
    )

    if (!confirmed) return

    setUnlinkingBuildingId(building.id)
    setErrorMessage('')

    try {
      await unlinkBuildingFromUser({
        buildingId: building.id,
        role: 'manager',
        userId: profileId,
      })

      setBuildings((prev) => prev.filter((item) => item.id !== building.id))
      setBuildingMetrics((prev) => {
        const nextMetrics = { ...prev }
        delete nextMetrics[building.id]
        return nextMetrics
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo desvincular el edificio.'
      )
    } finally {
      setUnlinkingBuildingId(null)
    }
  }

  const copyCreatedInviteCode = async () => {
    if (!createdInviteCode) return
    await navigator.clipboard.writeText(createdInviteCode)
  }

  const portfolioSummary = buildPortfolioSummary(buildings, buildingMetrics)
  const filteredBuildings = buildings.filter((building) => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return true

    return [building.name, building.address]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query))
  })

  const shareCreatedInviteCode = async () => {
    if (!createdInviteCode) return

    const shareMessage = `Usa este codigo para conectarte al edificio: ${createdInviteCode}`

    if (navigator.share) {
      await navigator.share({
        title: 'Codigo de edificio',
        text: shareMessage,
      })
      return
    }

    await navigator.clipboard.writeText(createdInviteCode)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
          <p className="text-[#6E7F9D]">Cargando edificios...</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <BuildingsHeader
            compact={compactHeader}
            onAdd={() => {
              setManagePanelOpen(true)
              requestAnimationFrame(() => {
                manageBuildingsRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              })
            }}
            onOpenMessages={
              headerConversation.canOpenConversation
                ? () => {
                    void headerConversation.openInbox()
                  }
                : null
            }
            portfolioSummary={portfolioSummary}
            unreadCount={headerConversation.unreadCount}
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

            <div className="space-y-5">
              <section className="flex gap-3">
                <label className="flex min-w-0 flex-1 items-center gap-3 rounded-[20px] border border-[#DDE5F1] bg-white px-5 py-4 text-[#8A98B2] shadow-[0_8px_24px_rgba(20,41,82,0.04)]">
                  <Search size={22} />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Buscar edificio por nombre o direccion..."
                    className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-[#142952] outline-none placeholder:text-[#8A98B2]"
                  />
                </label>
                <button
                  type="button"
                  className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[20px] border border-[#DDE5F1] bg-white text-[#6E7F9D] shadow-[0_8px_24px_rgba(20,41,82,0.04)]"
                  aria-label="Filtros"
                >
                  <SlidersHorizontal size={24} />
                </button>
              </section>

              <section className="space-y-4">
                {filteredBuildings.length > 0 ? (
                  filteredBuildings.map((building) => (
                    <BuildingPortfolioCard
                      key={building.id}
                      building={building}
                      metrics={
                        buildingMetrics[building.id] ?? EMPTY_BUILDING_METRICS
                      }
                      unlinking={unlinkingBuildingId === building.id}
                      onOpenApartments={(filter) =>
                        router.push(
                          filter
                            ? `/manager/buildings/${building.id}/units?filter=${filter}`
                            : `/manager/buildings/${building.id}/units`
                        )
                      }
                      onOpen={() =>
                        router.push(`/manager/buildings/${building.id}`)
                      }
                      onUnlink={() => {
                        void handleUnlinkBuilding(building)
                      }}
                    />
                  ))
                ) : (
                  <div className="rounded-[26px] border border-[#E3EAF3] bg-white p-6 text-sm leading-6 text-[#6E7F9D] shadow-[0_10px_28px_rgba(20,41,82,0.06)]">
                    {buildings.length === 0
                      ? 'Todavia no tienes edificios vinculados. Puedes crear uno nuevo o conectarte con un codigo.'
                      : 'No encontramos edificios con esa busqueda.'}
                  </div>
                )}
              </section>

              <section
                id="manage-buildings"
                ref={manageBuildingsRef}
                className={`scroll-mt-6 rounded-[28px] border border-[#E3EAF3] bg-white px-6 shadow-[0_10px_28px_rgba(20,41,82,0.06)] transition-all duration-300 ${
                  managePanelOpen
                    ? 'max-h-[820px] py-6 opacity-100'
                    : 'max-h-0 overflow-hidden border-transparent py-0 opacity-0'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2F66C8]">
                    {formMode === 'connect' ? <Link2 size={22} /> : <Plus size={22} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[#142952]">
                      {formMode === 'connect'
                        ? buildings.length === 0
                          ? 'Conectar tu primer edificio'
                          : 'Conectar otro edificio'
                        : 'Crear edificio nuevo'}
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-[#6E7F9D]">
                      {formMode === 'connect'
                        ? 'Usa un codigo compartido para enlazar el edificio a tu perfil.'
                        : 'Crea el edificio y comparte el codigo con el conserje.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormMode('connect')}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                      formMode === 'connect'
                        ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                        : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
                    }`}
                  >
                    Conectar con codigo
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormMode('create')}
                    className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${
                      formMode === 'create'
                        ? 'border-[#2F66C8] bg-[#EEF4FF] text-[#142952]'
                        : 'border-[#E2E8F0] bg-white text-[#6E7F9D]'
                    }`}
                  >
                    Crear edificio
                  </button>
                </div>

                {formMode === 'connect' ? (
                  <form onSubmit={handleConnectBuilding} className="mt-5 text-left">
                    <label className="mb-2 block text-sm font-semibold text-[#142952]">
                      Codigo del edificio
                    </label>
                    <input
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                      placeholder="BLDG-ABCD-1234"
                      className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 py-3 uppercase text-[#142952] outline-none focus:border-[#2F66C8]"
                    />
                    <button
                      type="submit"
                      disabled={connecting}
                      className="mt-3 w-full rounded-2xl bg-[#2F66C8] px-4 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(47,102,200,0.24)] disabled:opacity-70"
                    >
                      {connecting ? 'Conectando...' : 'Conectar edificio'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleCreateBuilding} className="mt-5 text-left">
                    <label className="mb-2 block text-sm font-semibold text-[#142952]">
                      Nombre del edificio
                    </label>
                    <input
                      value={newBuildingName}
                      onChange={(event) => setNewBuildingName(event.target.value)}
                      placeholder="Cote Saint Luc"
                      className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 py-3 text-[#142952] outline-none focus:border-[#2F66C8]"
                    />

                    <label className="mb-2 mt-4 block text-sm font-semibold text-[#142952]">
                      Direccion
                    </label>
                    <input
                      value={newBuildingAddress}
                      onChange={(event) => setNewBuildingAddress(event.target.value)}
                      placeholder="5545 Cote Saint Luc"
                      className="h-14 w-full rounded-2xl border border-[#D9E0EA] px-4 py-3 text-[#142952] outline-none focus:border-[#2F66C8]"
                    />

                    <button
                      type="submit"
                      disabled={connecting}
                      className="mt-4 w-full rounded-2xl bg-[#2F66C8] px-4 py-3 font-semibold text-white shadow-[0_10px_24px_rgba(47,102,200,0.24)] disabled:opacity-70"
                    >
                      {connecting ? 'Creando...' : 'Crear edificio'}
                    </button>
                  </form>
                )}

                {createdInviteCode ? (
                  <div className="mt-5 rounded-2xl border border-[#DCE7F5] bg-[#F8FAFE] p-4">
                    <p className="text-sm font-semibold text-[#142952]">
                      Codigo para compartir con el conserje
                    </p>
                    <p className="mt-2 rounded-xl bg-white px-3 py-2 font-mono text-sm font-semibold tracking-wide text-[#2F66C8]">
                      {createdInviteCode}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={copyCreatedInviteCode}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-sm font-semibold text-[#2F66C8]"
                      >
                        <Copy size={15} />
                        Copiar
                      </button>
                      <button
                        type="button"
                        onClick={shareCreatedInviteCode}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-sm font-semibold text-[#2F66C8]"
                      >
                        <Share2 size={15} />
                        Compartir
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </section>

          <ManagerRootBottomNav active="buildings" />
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
        canSaveAsTask
        onSaveAsTask={(message) => {
          setMessageTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setMessageTaskSourceId(message.id)
          headerConversation.closeConversation()
          setMessageTaskModalOpen(true)
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

      <ManagerTaskFormModal
        open={messageTaskModalOpen}
        onClose={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
        }}
        buildingId={headerConversation.activeBuildingId}
        managerId={profileId || headerConversation.currentUserId}
        conciergeId={
          headerConversation.contactRole === 'concierge'
            ? headerConversation.contactId
            : null
        }
        sourceMessageId={messageTaskSourceId}
        onCreated={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
        }}
        initialValues={messageTaskDraft}
      />
    </>
  )
}

async function fetchBuildingPortfolioMetrics(buildings: BuildingSummary[]) {
  const buildingIds = buildings.map((building) => building.id)
  const metrics = Object.fromEntries(
    buildingIds.map((id) => [id, { ...EMPTY_BUILDING_METRICS }])
  ) as Record<string, BuildingPortfolioMetrics>

  if (!buildingIds.length) return metrics

  const { data, error } = await supabase
    .from('building_units')
    .select(
      'building_id, unit_key, unit_label, unit_kind, status, garage_label'
    )
    .in('building_id', buildingIds)

  if (error) {
    console.error('Error loading building portfolio metrics:', error)
    return metrics
  }

  for (const row of
    ((data as Array<{
      building_id: string
      garage_label: string | null
      status: 'occupied' | 'available' | 'expiring_soon' | 'problematic' | 'inactive'
      unit_key: string
      unit_kind: 'apartment' | 'common_area' | 'garage' | 'storage'
      unit_label: string
    }>) || [])) {
    if (!row.building_id) continue

    const current = metrics[row.building_id] ?? { ...EMPTY_BUILDING_METRICS }

    if (row.unit_kind === 'apartment') {
      current.apartmentTotal += 1

      if (row.status === 'occupied' || row.status === 'expiring_soon') {
        current.occupied += 1
      }

      if (row.status === 'available') {
        current.available += 1
      }
    }

    if (row.garage_label?.trim() || row.unit_kind === 'garage') {
      current.garages += 1
    }

    metrics[row.building_id] = current
  }

  return metrics
}

function buildPortfolioSummary(
  buildings: BuildingSummary[],
  metrics: Record<string, BuildingPortfolioMetrics>
) {
  return buildings.reduce(
    (summary, building) => {
      const buildingMetric = metrics[building.id] ?? EMPTY_BUILDING_METRICS

      return {
        available: summary.available + buildingMetric.available,
        apartments: summary.apartments + buildingMetric.apartmentTotal,
        buildings: summary.buildings,
        garages: summary.garages + buildingMetric.garages,
        occupied: summary.occupied + buildingMetric.occupied,
      }
    },
    {
      apartments: 0,
      available: 0,
      buildings: buildings.length,
      garages: 0,
      occupied: 0,
    }
  )
}

function BuildingsHeader({
  compact,
  onAdd,
  onOpenMessages,
  portfolioSummary,
  unreadCount,
}: {
  compact: boolean
  onAdd: () => void
  onOpenMessages: (() => void) | null
  portfolioSummary: ReturnType<typeof buildPortfolioSummary>
  unreadCount: number
}) {
  return (
    <header className="relative z-30 shrink-0 bg-[#F6F8FC]">
      <div
        className={`relative overflow-hidden rounded-b-[30px] bg-white shadow-[0_14px_35px_rgba(20,41,82,0.08)] transition-all duration-300 ${
          compact ? 'h-[96px]' : 'min-h-[240px]'
        }`}
      >
        <div className="absolute inset-0">
          <Image
            src="/login-illustration-background1.png"
            alt="Fondo Montreal"
            fill
            priority
            sizes="448px"
            className="object-cover object-top opacity-[0.82]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/60 to-white/92" />
        </div>

        <div className="relative z-10 px-6 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1
                className={`font-bold leading-none tracking-tight text-[#142952] transition-all duration-300 ${
                  compact ? 'text-[29px]' : 'text-[34px]'
                }`}
              >
                Edificios
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {onOpenMessages ? (
                <button
                  type="button"
                  onClick={onOpenMessages}
                  className={`relative flex items-center justify-center border border-[#D9E0EA] bg-white/88 text-[#6E7F9D] shadow-[0_10px_28px_rgba(20,41,82,0.1)] backdrop-blur-sm transition-all duration-300 ${
                    compact ? 'h-10 w-10 rounded-[16px]' : 'h-12 w-12 rounded-[20px]'
                  }`}
                  aria-label="Abrir mensajes"
                >
                  <MessageSquareMore size={compact ? 18 : 21} />
                  {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#D64555] px-1 text-[11px] font-bold leading-none text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              <HeaderProfileButton compact={compact} variant="manager" />
            </div>
          </div>

          <div
            className={`transition-all duration-300 ${
              compact
                ? 'pointer-events-none mt-0 max-h-0 overflow-hidden opacity-0'
                : 'mt-5 max-h-[160px] opacity-100'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="max-w-[210px] text-[13px] font-medium leading-6 text-[#5E6E8C]">
                Administra tus edificios y consulta su estado general
              </p>
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#4666D9] px-4 text-[13px] font-bold text-white shadow-[0_12px_24px_rgba(70,102,217,0.22)] transition hover:bg-[#3656C8]"
              >
                <Plus size={18} />
                Agregar / Vincular
              </button>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#E3EAF3] bg-white/92 px-3 py-4 shadow-[0_10px_28px_rgba(20,41,82,0.06)] backdrop-blur-sm">
              <div className="grid grid-cols-4 divide-x divide-[#E3EAF3]">
                <PortfolioStat
                  icon={<Building2 size={20} />}
                  iconClassName="text-[#4666D9]"
                  label="Edificios"
                  value={portfolioSummary.buildings}
                />
                <PortfolioStat
                  icon={<Home size={20} />}
                  iconClassName="text-[#1FA35B]"
                  label="Aptos"
                  value={portfolioSummary.apartments}
                />
                <PortfolioStat
                  icon={<Users size={20} />}
                  iconClassName="text-[#8C55CF]"
                  label="Ocupados"
                  value={portfolioSummary.occupied}
                />
                <PortfolioStat
                  icon={<KeyRound size={20} />}
                  iconClassName="text-[#E48A15]"
                  label="Disp."
                  value={portfolioSummary.available}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function PortfolioStat({
  icon,
  iconClassName,
  label,
  value,
}: {
  icon: React.ReactNode
  iconClassName: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-center gap-2 px-2">
      <span className={`shrink-0 ${iconClassName}`}>{icon}</span>
      <span>
        <span className="block text-[20px] font-bold leading-none text-[#142952]">
          {value}
        </span>
        <span className="mt-1 block text-[10px] font-medium leading-3 text-[#7B8BA8]">
          {label}
        </span>
      </span>
    </div>
  )
}

function BuildingPortfolioCard({
  building,
  metrics,
  onOpenApartments,
  onOpen,
  onUnlink,
  unlinking,
}: {
  building: BuildingSummary
  metrics: BuildingPortfolioMetrics
  onOpen: () => void
  onOpenApartments: (
    filter?: 'occupied' | 'available' | 'expiring_soon' | 'problematic'
  ) => void
  onUnlink: () => void
  unlinking: boolean
}) {
  const status = getBuildingStatus(metrics)
  const [actionsOpen, setActionsOpen] = useState(false)

  const handleUnlink = () => {
    setActionsOpen(false)
    onUnlink()
  }

  return (
    <article className="relative rounded-[28px] border border-[#E3EAF3] bg-white p-4 shadow-[0_10px_30px_rgba(20,41,82,0.06)]">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onOpen}
          className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-[#EAF0FF] text-[#4666D9]"
          aria-label={`Ver ${building.name}`}
        >
          <Image
            src="/login-illustration-background1.png"
            alt=""
            fill
            sizes="96px"
            className="object-cover object-center opacity-70"
          />
          <span className="absolute inset-0 bg-gradient-to-br from-white/35 to-[#DDE8FF]/85" />
          <Building2 className="relative z-10" size={38} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="min-w-0 flex-1 text-left"
            >
              <h2 className="truncate text-[21px] font-bold leading-tight text-[#142952]">
                {building.name}
              </h2>
              <p className="mt-2 flex items-center gap-1 truncate text-[13px] font-medium text-[#7B8BA8]">
                <MapPin size={15} />
                {building.address || 'Sin direccion registrada'}
              </p>
            </button>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`hidden rounded-full px-4 py-2 text-sm font-semibold ${status.className}`}
              >
                {status.label}
              </span>
              <button
                type="button"
                onClick={() => setActionsOpen((value) => !value)}
                disabled={unlinking}
                className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-[#DDE5F1] bg-white text-[#6E7F9D] transition hover:border-[#F1D3D3] hover:bg-[#FFF8F8] hover:text-[#C53030] disabled:opacity-60"
                aria-label="Mas opciones"
                aria-expanded={actionsOpen}
                title={unlinking ? 'Desvinculando...' : 'Mas opciones'}
              >
                {unlinking ? <Trash2 size={20} /> : <MoreHorizontal size={22} />}
              </button>
            </div>
          </div>

          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      {actionsOpen ? (
        <div className="absolute right-4 top-16 z-20 w-52 overflow-hidden rounded-[20px] border border-[#E3EAF3] bg-white shadow-[0_18px_44px_rgba(20,41,82,0.16)]">
          <button
            type="button"
            onClick={() => {
              setActionsOpen(false)
              onOpen()
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#4666D9] transition hover:bg-[#F3F6FF]"
          >
            <Building2 size={17} />
            Ver edificio
          </button>
          <button
            type="button"
            onClick={() => {
              setActionsOpen(false)
              onOpenApartments()
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#4666D9] transition hover:bg-[#F3F6FF]"
          >
            <Pencil size={17} />
            Ver apartamentos
          </button>
          <button
            type="button"
            onClick={handleUnlink}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#C53030] transition hover:bg-[#FFF5F5]"
          >
            <Trash2 size={17} />
            Desvincular
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-4 divide-x divide-[#E3EAF3]">
        <BuildingMetricButton
          onClick={() => onOpenApartments()}
          icon={<Building2 size={20} />}
          label="Aptos"
          value={metrics.apartmentTotal}
          className="text-[#4666D9]"
        />
        <BuildingMetricButton
          onClick={() => onOpenApartments('occupied')}
          icon={<Users size={20} />}
          label="Ocup."
          value={metrics.occupied}
          className="text-[#1FA35B]"
        />
        <BuildingMetricButton
          onClick={() => onOpenApartments('available')}
          icon={<KeyRound size={20} />}
          label="Disp."
          value={metrics.available}
          className="text-[#E48A15]"
        />
        <BuildingMetricButton
          onClick={() => onOpenApartments()}
          icon={<Car size={20} />}
          label="Garajes"
          value={metrics.garages}
          className="text-[#8C55CF]"
        />
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#4666D9] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(70,102,217,0.22)] transition hover:bg-[#3656C8]"
        >
          Ver edificio
          <ChevronRight size={17} />
        </button>
      </div>
    </article>
  )
}

function BuildingMetricButton({
  className,
  icon,
  label,
  onClick,
  value,
}: {
  className: string
  icon: React.ReactNode
  label: string
  onClick: () => void
  value: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 px-2 text-center transition hover:opacity-85"
    >
      <span className={className}>{icon}</span>
      <span>
        <span className="block text-[20px] font-bold leading-none text-[#142952]">
          {value}
        </span>
        <span className="mt-1 block text-[11px] font-medium leading-3 text-[#7B8BA8]">
          {label}
        </span>
      </span>
    </button>
  )
}

function getBuildingStatus(metrics: BuildingPortfolioMetrics) {
  if (!metrics.apartmentTotal) {
    return {
      className: 'bg-[#F2F5FA] text-[#7B8BA8]',
      label: 'Sin datos',
    }
  }

  if (metrics.available > 0) {
    return {
      className: 'bg-[#FFF7E8] text-[#B76B12]',
      label: 'Disponibles',
    }
  }

  return {
    className: 'bg-[#EAF8EF] text-[#1D7D45]',
    label: 'Buen estado',
  }
}
