import {useCallback, useEffect, useState} from "react"

interface State {
  loadMore: boolean
}

export default function usePageLoader(
  totalPageCount: number,
  containerRef: React.RefObject<HTMLElement | null>
): State {
  const [loadMore, setLoadMore] = useState(false)

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
      setLoadMore(val)
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

  /*
  console.log(`Returning from usePageLoader with isLoading=${isLoading}`)
  */
  return {loadMore}
}
