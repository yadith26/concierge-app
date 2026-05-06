'use client'

import { useRef } from 'react'

type UseAgendaSwipeParams = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  swipeThreshold?: number
  directionThreshold?: number
}

export function useAgendaSwipe({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 50,
  directionThreshold = 10,
}: UseAgendaSwipeParams) {
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const gestureDirectionRef = useRef<'none' | 'horizontal' | 'vertical'>('none')

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
    gestureDirectionRef.current = 'none'
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return

    const deltaX = e.touches[0].clientX - touchStartXRef.current
    const deltaY = e.touches[0].clientY - touchStartYRef.current

    if (gestureDirectionRef.current === 'none') {
      if (
        Math.abs(deltaX) < directionThreshold &&
        Math.abs(deltaY) < directionThreshold
      ) {
        return
      }

      gestureDirectionRef.current =
        Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
    }
  }

  const resetGesture = () => {
    touchStartXRef.current = null
    touchStartYRef.current = null
    gestureDirectionRef.current = 'none'
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (
      touchStartXRef.current === null ||
      touchStartYRef.current === null ||
      gestureDirectionRef.current !== 'horizontal'
    ) {
      resetGesture()
      return
    }

    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current

    if (deltaX <= -swipeThreshold) {
      onSwipeLeft()
    } else if (deltaX >= swipeThreshold) {
      onSwipeRight()
    }

    resetGesture()
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  }
}