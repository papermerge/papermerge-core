import {getBaseURL, getDefaultHeaders} from "@/utils"
import {useEffect, useRef, useState} from "react"

interface DocumentPreview {
  status: string
  url: string | null
}

interface PreviewStatusResponseItem {
  doc_id: string
  status: string
  preview_image_url: string | null
}

interface UsePreviewPollingOptions {
  pollIntervalMs?: number
  maxRetries?: number
}

interface UsePreviewPollingResult {
  previews: Record<string, DocumentPreview>
  allReady: boolean
  isLoading: boolean
  error: Error | null
}

function toDocIdsQueryParams(docIds: string[]): string {
  const params = new URLSearchParams()
  docIds.forEach(id => params.append("doc_ids", id))
  return params.toString()
}

const usePreviewPolling = (
  documentIds: string[],
  {pollIntervalMs = 3000, maxRetries = 20}: UsePreviewPollingOptions = {}
): UsePreviewPollingResult => {
  const [previews, setPreviews] = useState<Record<string, DocumentPreview>>({})
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

    if (!documentIds || documentIds.length === 0) {
      return
    }

    const pollPreviewStatuses = async () => {
      try {
        const queryString = toDocIdsQueryParams(documentIds)
        const res = await fetch(
          `${getBaseURL()}/api/documents/thumbnail-img-status/?${queryString}`,
          {headers: headers}
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: PreviewStatusResponseItem[] = await res.json()
        setError(null)
        setIsLoading(false)

        setPreviews(prev => {
          const updated: Record<string, DocumentPreview> = {...prev}

          let complete = true

          data.forEach(({doc_id, status, preview_image_url}) => {
            const newPreview: DocumentPreview = {
              status,
              url: preview_image_url || null
            }

            updated[doc_id] = newPreview

            if (status !== "ready") {
              complete = false
            }
          })

          setAllReady(complete)

          if (complete && intervalRef.current !== null) {
            clearInterval(intervalRef.current)
          }

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

    pollPreviewStatuses() // First run
    intervalRef.current = window.setInterval(
      pollPreviewStatuses,
      pollIntervalMs
    )

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [documentIds, pollIntervalMs, maxRetries])

  if (retryCount.current > maxRetries) {
    const newError = new Error(
      `Failed to get thumbnails after ${maxRetries} retries`
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

export default usePreviewPolling
