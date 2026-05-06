'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  PointerEvent as ReactPointerEvent,
  TouchEvent as ReactTouchEvent,
} from 'react'

type SwipeState = 'closed' | 'left-open' | 'right-open'
type GestureDirection = 'none' | 'horizontal' | 'vertical'

const ACTION_WIDTH = 96
const SWIPE_THRESHOLD = 60
const MAX_DRAG = 140
const DIRECTION_THRESHOLD = 10
const CLICK_SUPPRESSION_THRESHOLD = 18

export default function useTaskCardSwipe() {
  const [translateX, setTranslateX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [swipeState, setSwipeState] = useState<SwipeState>('closed')

  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchMovedRef = useRef(false)
  const startTranslateRef = useRef(0)
  const latestTranslateRef = useRef(0)
  const pointerIdRef = useRef<number | null>(null)
  const gestureDirectionRef = useRef<GestureDirection>('none')
  const rootRef = useRef<HTMLDivElement | null>(null)

  const updateTranslateX = useCallback((value: number) => {
    latestTranslateRef.current = value
    setTranslateX(value)
  }, [])

  const openLeft = useCallback(() => {
    setSwipeState('left-open')
    updateTranslateX(-ACTION_WIDTH)
  }, [updateTranslateX])

  const openRight = useCallback(() => {
    setSwipeState('right-open')
    updateTranslateX(ACTION_WIDTH)
  }, [updateTranslateX])

  const closeSwipe = useCallback(() => {
    setSwipeState('closed')
    updateTranslateX(0)
  }, [updateTranslateX])

  const resetTouchState = () => {
    const shouldSuppressClick = touchMovedRef.current

    touchStartXRef.current = null
    touchStartYRef.current = null
    gestureDirectionRef.current = 'none'
    setDragging(false)

    if (shouldSuppressClick) {
      window.setTimeout(() => {
        touchMovedRef.current = false
      }, 120)
      return
    }

    touchMovedRef.current = false
  }

  const startGesture = (clientX: number, clientY: number) => {
    touchStartXRef.current = clientX
    touchStartYRef.current = clientY
    touchMovedRef.current = false
    gestureDirectionRef.current = 'none'
    setDragging(false)

    startTranslateRef.current =
      swipeState === 'left-open'
        ? -ACTION_WIDTH
        : swipeState === 'right-open'
          ? ACTION_WIDTH
          : 0
  }

  const moveGesture = (clientX: number, clientY: number) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return
    }

    const deltaX = clientX - touchStartXRef.current
    const deltaY = clientY - touchStartYRef.current

    if (gestureDirectionRef.current === 'none') {
      if (
        Math.abs(deltaX) < DIRECTION_THRESHOLD &&
        Math.abs(deltaY) < DIRECTION_THRESHOLD
      ) {
        return
      }

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        gestureDirectionRef.current = 'vertical'
        return
      }

      gestureDirectionRef.current = 'horizontal'
      setDragging(true)
    }

    if (gestureDirectionRef.current !== 'horizontal') {
      return
    }

    if (Math.abs(deltaX) > CLICK_SUPPRESSION_THRESHOLD) {
      touchMovedRef.current = true
    }

    const next = startTranslateRef.current + deltaX
    const limited = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, next))
    updateTranslateX(limited)
  }

  const endGesture = () => {
    if (gestureDirectionRef.current !== 'horizontal') {
      resetTouchState()
      return
    }

    const finalTranslateX = latestTranslateRef.current

    if (finalTranslateX <= -SWIPE_THRESHOLD) {
      openLeft()
    } else if (finalTranslateX >= SWIPE_THRESHOLD) {
      openRight()
    } else {
      closeSwipe()
    }

    resetTouchState()
  }

  const handleTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    startGesture(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    moveGesture(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    endGesture()
  }

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    pointerIdRef.current = e.pointerId
    startGesture(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return
    moveGesture(e.clientX, e.clientY)
  }

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return

    pointerIdRef.current = null
    endGesture()
  }

  useEffect(() => {
    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        closeSwipe()
      }
    }

    document.addEventListener('mousedown', handlePointerDownOutside)
    document.addEventListener('touchstart', handlePointerDownOutside)

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside)
      document.removeEventListener('touchstart', handlePointerDownOutside)
    }
  }, [closeSwipe])

  return {
    rootRef,
    translateX,
    dragging,
    swipeState,
    touchMovedRef,
    closeSwipe,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
  }
}
