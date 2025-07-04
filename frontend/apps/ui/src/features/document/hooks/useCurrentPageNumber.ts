import {useCallback, useEffect, useState} from "react"

interface State {
  currentPageNumber: number
}

interface Args {
  containerRef: React.RefObject<HTMLElement | null>
  cssSelector: string
  initialPageNumber?: number
}

export default function useCurrentPageNumber({
  containerRef,
  cssSelector,
  initialPageNumber = 1
}: Args): State {
  const [currentPage, setCurrentPage] = useState(initialPageNumber)

  const checkCurrentPage = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const pageElements = container.querySelectorAll<HTMLElement>(cssSelector)
    if (pageElements.length === 0) {
      return
    }

    const containerRect = container.getBoundingClientRect()
    const containerMidPoint = containerRect.top + containerRect.height / 2

    const currentIndex = Array.from(pageElements).findIndex(el => {
      const elRect = el.getBoundingClientRect()
      return (
        elRect.top <= containerMidPoint && elRect.bottom >= containerMidPoint
      )
    })

    if (currentIndex !== -1) {
      setCurrentPage(currentIndex + 1)
    }
  }, [containerRef])

  useEffect(() => {
    if (!containerRef) {
      return
    }

    const container = containerRef.current
    if (!container) {
      return
    }

    checkCurrentPage()

    container.addEventListener("scroll", checkCurrentPage)
    window.addEventListener("resize", checkCurrentPage)

    return () => {
      container.removeEventListener("scroll", checkCurrentPage)
      window.removeEventListener("resize", checkCurrentPage)
    }
  }, [checkCurrentPage])

  return {currentPageNumber: currentPage}
}
