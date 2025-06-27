import {useCallback, useEffect, useState} from "react"

interface State {
  shouldLoadMore: boolean
  isLoading: boolean
  markLoadingStart: () => void
  markLoadingDone: () => void
}

export default function usePageLoader(
  totalPageCount: number,
  containerRef: React.RefObject<HTMLElement | null>
): State {
  const [isLoading, setIsLoading] = useState(false)
  const [shouldLoadMore, setShouldLoadMore] = useState(false)

  const checkIfLastElementVisible = useCallback(() => {
    if (!containerRef) {
      return
    }
    const container = containerRef.current
    if (!container) return

    const pageElements = container.querySelectorAll<HTMLElement>(".page")
    if (pageElements.length === 0) return

    const lastChild = pageElements[pageElements.length - 1] as HTMLElement
    const containerRect = container.getBoundingClientRect()
    const lastChildRect = lastChild.getBoundingClientRect()

    const isFullyVisible = lastChildRect.bottom <= containerRect.bottom
    /*
    console.log(
      `lastChildRect.bottom <= containerRect.bottom: ${lastChildRect.bottom} <= ${containerRect.bottom} ${lastChildRect.bottom <= containerRect.bottom}`
    )
    console.log(
      `setting should load more to ${isFullyVisible && totalPageCount > pageElements.length}`
    )
    */
    const val = isFullyVisible && totalPageCount > pageElements.length
    if (lastChildRect.height > 100) {
      setShouldLoadMore(val)
    }
  }, [containerRef])

  useEffect(() => {
    if (!containerRef) {
      return
    }

    const container = containerRef.current
    if (!container) return

    checkIfLastElementVisible()

    container.addEventListener("scroll", checkIfLastElementVisible)
    window.addEventListener("resize", checkIfLastElementVisible)

    return () => {
      container.removeEventListener("scroll", checkIfLastElementVisible)
      window.removeEventListener("resize", checkIfLastElementVisible)
    }
  }, [checkIfLastElementVisible])

  const markLoadingDone = () => {
    setIsLoading(false)
    checkIfLastElementVisible() // recheck in case layout changed
  }

  const markLoadingStart = () => {
    setIsLoading(true)
  }

  return {shouldLoadMore, isLoading, markLoadingStart, markLoadingDone}
}
