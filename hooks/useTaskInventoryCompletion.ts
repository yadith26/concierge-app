'use client'

import { useCallback, useMemo, useState } from 'react'
import { useInventoryPhotos } from '@/hooks/useInventoryPhotos'
import {
  rankMatchingInventoryItems,
  rankMatchingInventoryItemsDetailed,
  type InventoryMatchReason,
} from '@/lib/inventory/findMatchingInventoryItem'
import {
  createInventoryItem,
  consumeInventoryItemForTask,
  fetchActiveInventoryItems,
  fetchInventoryFormOptions,
  increaseInventoryItemFromTask,
  type SaveInventoryPayload,
} from '@/lib/inventory/inventoryMutations'
import { uploadPhotosForInventoryItem } from '@/lib/inventory/inventoryPhotoActions'
import { buildInventoryPrefillFromTask } from '@/lib/inventory/taskInventoryPrefill'
import {
  isMaterialInventoryCategory,
  normalizeInventoryCategory,
} from '@/lib/inventory/inventoryCatalog'
import { inferInventoryItemFromName } from '@/lib/inventory/inventorySmartParser'
import {
  INVENTORY_CANDIDATE_CATEGORIES,
  isDeliveryInventoryCategory,
} from '@/lib/inventory/taskInventoryCategories'
import type { InventoryItem } from '@/lib/inventory/inventoryTypes'
import type { Task } from '@/lib/tasks/taskTypes'

type CompletionStatus = 'pending' | 'in_progress' | 'completed'

type CompletionHandler = (
  taskId: string,
  status: CompletionStatus
) => Promise<boolean | void>

type UseTaskInventoryCompletionParams = {
  buildingId: string
  profileId: string
}

type InventorySelectionMode = 'consume' | 'increase'

export function useTaskInventoryCompletion({
  buildingId,
  profileId,
}: UseTaskInventoryCompletionParams) {
  const {
    photos,
    existingPhotos,
    hydrateExistingPhotos,
    resetAllPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
  } = useInventoryPhotos()
  const [promptOpen, setPromptOpen] = useState(false)
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [inventorySelectionOpen, setInventorySelectionOpen] = useState(false)
  const [inventorySelectionMode, setInventorySelectionMode] =
    useState<InventorySelectionMode>('consume')
  const [inventoryUsageOpen, setInventoryUsageOpen] = useState(false)
  const [inventorySelectionInfo, setInventorySelectionInfo] = useState('')
  const [allowCreateNewDespiteMatches, setAllowCreateNewDespiteMatches] =
    useState(false)
  const [savingInventory, setSavingInventory] = useState(false)
  const [inventoryMessage, setInventoryMessage] = useState('')
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [availableNames, setAvailableNames] = useState<string[]>([])
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [availableInventoryItems, setAvailableInventoryItems] = useState<InventoryItem[]>([])
  const [selectedInventoryItem, setSelectedInventoryItem] =
    useState<InventoryItem | null>(null)
  const [inventoryUsageQuantity, setInventoryUsageQuantity] = useState('1')
  const [inventoryUsageLocation, setInventoryUsageLocation] = useState('')
  const [pendingTask, setPendingTask] = useState<Task | null>(null)
  const [pendingCompletion, setPendingCompletion] =
    useState<CompletionHandler | null>(null)
  const [taskCompletedInFlow, setTaskCompletedInFlow] = useState(false)

  const initialValues = useMemo(() => {
    if (!pendingTask) return null
    return buildInventoryPrefillFromTask(pendingTask)
  }, [pendingTask])

  const inferredInventoryItemLabel = useMemo(() => {
    if (!pendingTask) return ''
    return (
      initialValues?.item_type?.trim() ||
      inferInventoryItemFromName([pendingTask.title, pendingTask.description || ''].join(' '))
    )
  }, [initialValues?.item_type, pendingTask])

  const rankedCompatibleInventoryEntries = useMemo(() => {
    const activeItems = availableInventoryItems.filter(
      (item) => Number(item.quantity || 0) > 0
    )
    if (!pendingTask) return []

    const normalizedCategory = initialValues?.category
      ? normalizeInventoryCategory(initialValues.category)
      : ''

    return rankMatchingInventoryItemsDetailed(activeItems, {
      textToMatch: [pendingTask.title, pendingTask.description || ''].join(' '),
      preferredCategory: normalizedCategory,
      preferredItemLabel: inferredInventoryItemLabel,
    })
  }, [
    availableInventoryItems,
    inferredInventoryItemLabel,
    initialValues?.category,
    pendingTask,
  ])

  const compatibleInventoryItems = useMemo(() => {
    const activeItems = availableInventoryItems.filter(
      (item) => Number(item.quantity || 0) > 0
    )
    if (!pendingTask) return activeItems

    const normalizedCategory = initialValues?.category
      ? normalizeInventoryCategory(initialValues.category)
      : ''
    const rankedMatches = rankedCompatibleInventoryEntries.map((entry) => entry.item)

    if (rankedMatches.length > 0) {
      return rankedMatches
    }

    const categoryMatches = normalizedCategory
      ? activeItems.filter(
          (item) =>
            normalizeInventoryCategory(item.category) === normalizedCategory
        )
      : activeItems

    return [...categoryMatches].sort((a, b) => {
      const aType = a.item_type?.trim() || a.name
      const bType = b.item_type?.trim() || b.name
      if (aType !== bType) return aType.localeCompare(bType)
      return a.name.localeCompare(b.name)
    })
  }, [
    availableInventoryItems,
    initialValues?.category,
    pendingTask,
    rankedCompatibleInventoryEntries,
  ])

  const suggestedInventoryItemId = compatibleInventoryItems[0]?.id || null
  const compatibleInventoryReasonMap = useMemo(() => {
    return rankedCompatibleInventoryEntries.reduce<Record<string, InventoryMatchReason[]>>(
      (acc, entry) => {
        acc[entry.item.id] = entry.reasons
        return acc
      },
      {}
    )
  }, [rankedCompatibleInventoryEntries])

  const resetFlow = useCallback(() => {
    setPromptOpen(false)
    setInventoryModalOpen(false)
    setInventorySelectionOpen(false)
    setInventoryUsageOpen(false)
    setSavingInventory(false)
    setInventoryMessage('')
    setInventorySelectionInfo('')
    setAvailableCategories([])
    setAvailableNames([])
    setAvailableLocations([])
    setAvailableInventoryItems([])
    setSelectedInventoryItem(null)
    setInventoryUsageQuantity('1')
    setInventoryUsageLocation('')
    setPendingTask(null)
    setPendingCompletion(null)
    setTaskCompletedInFlow(false)
    setInventorySelectionMode('consume')
    setAllowCreateNewDespiteMatches(false)
    resetAllPhotos()
  }, [resetAllPhotos])

  const runCompletion = useCallback(async () => {
    if (!pendingTask || !pendingCompletion) {
      return false
    }

    const result = await pendingCompletion(pendingTask.id, 'completed')
    return result !== false
  }, [pendingCompletion, pendingTask])

  const requestCompletion = useCallback(
    async (task: Task, onCompleteTask: CompletionHandler) => {
      if (!INVENTORY_CANDIDATE_CATEGORIES.has(task.category)) {
        await onCompleteTask(task.id, 'completed')
        return
      }

      setPendingTask(task)
      setPendingCompletion(() => onCompleteTask)
      setTaskCompletedInFlow(false)
      setInventoryMessage('')
      setPromptOpen(true)
    },
    []
  )

  const completeWithoutInventory = useCallback(async () => {
    const didComplete = await runCompletion()

    if (didComplete) {
      resetFlow()
      return
    }

    setInventoryMessage('No se pudo completar la tarea.')
    setPromptOpen(false)
  }, [resetFlow, runCompletion])

  const openInventoryForm = useCallback(async (forceCreateNew = false) => {
    if (!buildingId) {
      setInventoryMessage('No encontramos el edificio para actualizar inventario.')
      return
    }

    try {
      if (
        pendingTask?.category &&
        isDeliveryInventoryCategory(pendingTask.category) &&
        !forceCreateNew &&
        !allowCreateNewDespiteMatches
      ) {
        const inventoryItems = await fetchActiveInventoryItems(buildingId)
        const rankedMatches = rankMatchingInventoryItems(inventoryItems, {
          textToMatch: [pendingTask.title, pendingTask.description || ''].join(' '),
          preferredCategory: initialValues?.category
            ? normalizeInventoryCategory(initialValues.category)
            : '',
          preferredItemLabel: inferredInventoryItemLabel,
        })

        if (rankedMatches.length > 0) {
          setAvailableInventoryItems(inventoryItems)
          setInventorySelectionMode('increase')
          setInventorySelectionInfo(
            'Encontré items parecidos en inventario. Si quieres, puedes sumarlos aquí antes de crear uno nuevo.'
          )
          setInventoryMessage('')
          setPromptOpen(false)
          setInventoryModalOpen(false)
          setInventorySelectionOpen(true)
          return
        }
      }

      const options = await fetchInventoryFormOptions(buildingId)
      setAvailableCategories(options.categories)
      setAvailableNames(options.names)
      setAvailableLocations(options.locations)
      setInventoryMessage('')
      setInventorySelectionInfo('')
      hydrateExistingPhotos([])
      setPromptOpen(false)
      setInventorySelectionOpen(false)
      setInventoryUsageOpen(false)
      setInventoryModalOpen(true)
    } catch (error) {
      setInventoryMessage(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las opciones de inventario.'
      )
    }
  }, [
    allowCreateNewDespiteMatches,
    buildingId,
    hydrateExistingPhotos,
    inferredInventoryItemLabel,
    initialValues?.category,
    pendingTask?.category,
    pendingTask?.description,
    pendingTask?.title,
  ])

  const openExistingInventorySelector = useCallback(async () => {
    if (!buildingId) {
      setInventoryMessage('No encontramos el edificio para revisar inventario.')
      return
    }

    try {
      const inventoryItems = await fetchActiveInventoryItems(buildingId)
      setAvailableInventoryItems(inventoryItems)
      setInventorySelectionMode(
        pendingTask?.category &&
          isDeliveryInventoryCategory(pendingTask.category)
          ? 'increase'
          : 'consume'
      )
      setInventoryMessage('')
      setInventorySelectionInfo('')
      setAllowCreateNewDespiteMatches(false)
      setPromptOpen(false)
      setInventorySelectionOpen(true)
    } catch (error) {
      setInventoryMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el inventario disponible.'
      )
    }
  }, [buildingId, pendingTask?.category])

  const saveInventoryAndComplete = useCallback(
    async (payload: SaveInventoryPayload) => {
      if (!buildingId || !profileId || !pendingTask) {
        setInventoryMessage('Faltan datos para actualizar el inventario.')
        return
      }

      setSavingInventory(true)
      setInventoryMessage('')

      let alreadyCompleted = taskCompletedInFlow

      try {

        if (!alreadyCompleted) {
          const didComplete = await runCompletion()

          if (!didComplete) {
            setInventoryMessage('No se pudo completar la tarea.')
            return
          }

          setTaskCompletedInFlow(true)
          alreadyCompleted = true
        }

        const insertedItem = await createInventoryItem({
          buildingId,
          profileId,
          payload,
        })

        await uploadPhotosForInventoryItem({
          itemId: insertedItem.id,
          profileId,
          photos,
        })

        resetFlow()
      } catch (error) {
        setInventoryMessage(
          alreadyCompleted
            ? 'La tarea ya se completo, pero no se pudo guardar el inventario.'
            : error instanceof Error
              ? error.message
              : 'No se pudo guardar el inventario.'
        )
      } finally {
        setSavingInventory(false)
      }
    },
    [
      buildingId,
      pendingTask,
      profileId,
      photos,
      resetFlow,
      runCompletion,
      taskCompletedInFlow,
    ]
  )

  const addCategoryOption = useCallback((value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    setAvailableCategories((current) => {
      const exists = current.some(
        (item) => item.toLowerCase() === trimmedValue.toLowerCase()
      )

      return exists ? current : [...current, trimmedValue].sort((a, b) => a.localeCompare(b))
    })
  }, [])

  const addLocationOption = useCallback((value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    setAvailableLocations((current) => {
      const exists = current.some(
        (item) => item.toLowerCase() === trimmedValue.toLowerCase()
      )

      return exists ? current : [...current, trimmedValue].sort((a, b) => a.localeCompare(b))
    })
  }, [])

  const addNameOption = useCallback((value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    setAvailableNames((current) => {
      const exists = current.some(
        (item) => item.toLowerCase() === trimmedValue.toLowerCase()
      )

      return exists
        ? current
        : [...current, trimmedValue].sort((a, b) => a.localeCompare(b))
    })
  }, [])

  const continueCreatingNewInventoryItem = useCallback(async () => {
    setAllowCreateNewDespiteMatches(true)
    await openInventoryForm(true)
  }, [openInventoryForm])

  const completeUsingExistingInventoryItem = useCallback(
    async (item: InventoryItem) => {
      if (!profileId || !pendingTask) {
        setInventoryMessage('Faltan datos para actualizar el inventario.')
        return
      }

      setSavingInventory(true)
      setInventoryMessage('')

      let alreadyCompleted = taskCompletedInFlow

      try {
        if (!alreadyCompleted) {
          const didComplete = await runCompletion()

          if (!didComplete) {
            setInventoryMessage('No se pudo completar la tarea.')
            return
          }

          setTaskCompletedInFlow(true)
          alreadyCompleted = true
        }

        if (inventorySelectionMode === 'increase') {
          await increaseInventoryItemFromTask({
            item,
            task: pendingTask,
            profileId,
          })
        } else {
          await consumeInventoryItemForTask({
            item,
            task: pendingTask,
            profileId,
            quantityUsed: Number(inventoryUsageQuantity || 0) || 1,
            locationUsed: inventoryUsageLocation.trim() || null,
          })
        }

        resetFlow()
      } catch (error) {
        setInventoryMessage(
          alreadyCompleted
            ? error instanceof Error
              ? error.message
              : 'La tarea ya se completo, pero no se pudo descontar el inventario.'
            : error instanceof Error
              ? error.message
              : 'No se pudo completar el flujo de inventario.'
        )
      } finally {
        setSavingInventory(false)
      }
    },
    [
      inventorySelectionMode,
      inventoryUsageLocation,
      inventoryUsageQuantity,
      pendingTask,
      profileId,
      resetFlow,
      runCompletion,
      taskCompletedInFlow,
    ]
  )

  const selectExistingInventoryItem = useCallback(
    async (item: InventoryItem) => {
      if (inventorySelectionMode === 'increase') {
        await completeUsingExistingInventoryItem(item)
        return
      }

      setSelectedInventoryItem(item)
      setInventoryUsageQuantity('1')
      setInventoryUsageLocation(
        pendingTask?.apartment_or_area?.trim() || item.location?.trim() || ''
      )
      setInventorySelectionOpen(false)
      setInventoryUsageOpen(true)
      setInventoryMessage('')
    },
    [
      completeUsingExistingInventoryItem,
      inventorySelectionMode,
      pendingTask?.apartment_or_area,
    ]
  )

  const confirmInventoryUsage = useCallback(async () => {
    if (!selectedInventoryItem) {
      setInventoryMessage('No encontramos el item seleccionado.')
      return
    }

    const parsedQuantity = Number(inventoryUsageQuantity || 0)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      setInventoryMessage('La cantidad usada no es valida.')
      return
    }

    await completeUsingExistingInventoryItem(selectedInventoryItem)
  }, [
    completeUsingExistingInventoryItem,
    inventoryUsageQuantity,
    selectedInventoryItem,
  ])

  const closeInventoryUsage = useCallback(() => {
    setInventoryUsageOpen(false)
    setInventorySelectionOpen(false)
    setSelectedInventoryItem(null)
    setInventoryUsageQuantity('1')
    setInventoryUsageLocation('')
    setSavingInventory(false)
    setInventoryMessage('')
  }, [])

  return {
    promptOpen,
    inventoryModalOpen,
    inventorySelectionOpen,
    inventoryUsageOpen,
    inventorySelectionMode,
    inventorySelectionInfo,
    savingInventory,
    inventoryMessage,
    setInventoryMessage,
    availableCategories,
    availableNames,
    availableLocations,
    compatibleInventoryItems,
    compatibleInventoryReasonMap,
    suggestedInventoryItemId,
    selectedInventoryItem,
    inventoryUsageQuantity,
    inventoryUsageLocation,
    isSelectedInventoryMaterial: isMaterialInventoryCategory(
      selectedInventoryItem?.category
    ),
    photos,
    existingPhotos,
    handlePhotosSelected,
    removeNewPhoto,
    removeExistingPhoto,
    addCategoryOption,
    addNameOption,
    addLocationOption,
    pendingTask,
    initialValues,
    inferredInventoryItemLabel,
    requestCompletion,
    completeWithoutInventory,
    openInventoryForm,
    openExistingInventorySelector,
    continueCreatingNewInventoryItem,
    selectExistingInventoryItem,
    confirmInventoryUsage,
    closePrompt: resetFlow,
    closeInventoryModal: resetFlow,
    closeInventorySelection: resetFlow,
    closeInventoryUsage,
    setInventoryUsageQuantity,
    setInventoryUsageLocation,
    saveInventoryAndComplete,
    completeUsingExistingInventoryItem,
  }
}

export type TaskInventoryCompletionState = ReturnType<
  typeof useTaskInventoryCompletion
>
