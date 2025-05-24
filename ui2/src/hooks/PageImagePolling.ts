import type {UUID} from "@/types.d/common"
import type {PageImageDict, StatusForSize} from "@/types.d/page_image"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import {useEffect, useRef, useState} from "react"

interface PageImageStatusResponseItem {
  page_id: string
  status: Array<StatusForSize>
}

interface UsePageImagePollingOptions {
  pollIntervalMs: number
  maxRetries: number
}

interface UsePageImagePollingResult {
  previews: PageImageDict
  allReady: boolean
  isLoading: boolean
  error: Error | null
}

function toPageIdsQueryParams(pageIds: string[]): string {
  const params = new URLSearchParams()
  pageIds.forEach(id => params.append("page_ids", id))

  return params.toString()
}

const usePageImagePolling = (
  pageIds: UUID[],
  {pollIntervalMs, maxRetries}: UsePageImagePollingOptions
): UsePageImagePollingResult => {
  const [previews, setPreviews] = useState<PageImageDict>({})
  const [allReady, setAllReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const retryCount = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const headers = getDefaultHeaders()

  useEffect(() => {
    if (retryCount.current > maxRetries) {
      return
    }

    if (!pageIds || pageIds.length === 0) {
      return
    }

    const pollImagePreviewStatuses = async () => {
      try {
        const queryString = toPageIdsQueryParams(pageIds)
        const res = await fetch(
          `${getBaseURL()}/api/pages/preview-img-status/?${queryString}`,
          {headers: headers}
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: PageImageStatusResponseItem[] = await res.json()
        setError(null)
        setIsLoading(false)

        setPreviews(prev => {
          const updated: PageImageDict = {...prev}
          /* polling will stop when:
            - it runs out of number of tries
            - each page has either medium size or large size available (i.e. status ready)
          */
          let complete = true

          data.forEach(({page_id, status}) => {
            updated[page_id] = status
            let md_page_is_ready = false
            let lg_page_is_ready = false

            for (const st of status) {
              if (st.status == "ready" && st.size == "md") {
                md_page_is_ready = true
              }
              if (st.status == "ready" && st.size == "lg") {
                lg_page_is_ready = true
              }
            }

            if (md_page_is_ready == false && lg_page_is_ready == false) {
              complete = false
            }
          })

          if (complete && intervalRef.current !== null) {
            clearInterval(intervalRef.current)
          }

          setAllReady(complete)

          return updated
        })
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error("Unknown error")
        setError(errorObj)
        retryCount.current += 1
        if (retryCount.current >= maxRetries && intervalRef.current !== null) {
          clearInterval(intervalRef.current)
        }
      }
    }

    pollImagePreviewStatuses()
    intervalRef.current = window.setInterval(
      pollImagePreviewStatuses,
      pollIntervalMs
    )

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [pageIds, pollIntervalMs, maxRetries])

  if (retryCount.current > maxRetries) {
    const newError = new Error(
      `Failed to get page previews after ${maxRetries} retries`
    )

    return {
      previews,
      allReady,
      isLoading: false,
      error: newError
    }
  }

  return {
    previews,
    allReady,
    isLoading,
    error
  }
}

export default usePageImagePolling
