import {getBaseURL, getDefaultHeaders} from "@/utils"
import {useEffect, useRef, useState} from "react"

type UUID = string

interface PageImagePreview {
  status_sm: string
  url_sm: string | null
  status_md: string
  url_md: string | null
  status_lg: string
  url_lg: string | null
  status_xl: string
  url_xl: string | null
}

type PageImageStatus = "pending" | "ready" | "failed"
type PageImageSize = "sm" | "md" | "lg" | "xl"
type PageImageDict = Record<UUID, Array<StatusForSize>>

interface StatusForSize {
  status: PageImageStatus | null
  url: string | null
  size: PageImageSize
}

interface PageImageStatusResponseItem {
  page_id: string
  status: Array<StatusForSize>
}

interface UsePageImagePollingOptions {
  pollIntervalMs?: number
  maxRetries?: number
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
  {pollIntervalMs = 3000, maxRetries = 20}: UsePageImagePollingOptions = {}
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
          let complete = true

          data.forEach(({page_id, status}) => {
            updated[page_id] = status
            for (const st of status) {
              if (st.status != "ready") {
                complete = false
              }
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
