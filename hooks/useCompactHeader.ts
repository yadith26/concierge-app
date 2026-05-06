'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useCompactHeader<T extends HTMLElement = HTMLElement>(
  threshold = 18
) {
  const [element, setElement] = useState<T | null>(null)
  const [compactHeader, setCompactHeader] = useState(false)
  const lastScrollTopRef = useRef(0)
  const scrollRef = useCallback((node: T | null) => {
    setElement(node)
    if (!node) {
      setCompactHeader(false)
      lastScrollTopRef.current = 0
    }
  }, [])

  useEffect(() => {
    if (!element) return

    const handleScroll = () => {
      const top = element.scrollTop
      const previousTop = lastScrollTopRef.current
      const scrollingDown = top >= previousTop
      lastScrollTopRef.current = top

      setCompactHeader((prev) => {
        if (prev) {
          return top > 4
        }

        return scrollingDown && top > threshold
      })
    }

    handleScroll()
    element.addEventListener('scroll', handleScroll)

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [element, threshold])

  return {
    scrollRef,
    compactHeader,
  }
}
