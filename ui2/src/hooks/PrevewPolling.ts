import {getDefaultHeaders} from "@/utils"
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
  updatedPreviews: Record<string, DocumentPreview>
  allReady: boolean
  isLoading: boolean
  error: Error | null
}

const usePreviewPolling = (
  documentIds: string[],
  {pollIntervalMs = 3000, maxRetries = 20}: UsePreviewPollingOptions = {}
): UsePreviewPollingResult => {
  const [previews, setPreviews] = useState<Record<string, DocumentPreview>>({})
  const [updatedPreviews, setUpdatedPreviews] = useState<
    Record<string, DocumentPreview>
  >({})
  const [allReady, setAllReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const retryCount = useRef(0)
  const intervalRef = useRef<number | null>(null)
  const previousPreviewsRef = useRef<Record<string, DocumentPreview>>({})
  const headers = getDefaultHeaders()

  useEffect(() => {
    if (!documentIds || documentIds.length === 0) return

    const pollPreviewStatuses = async () => {
      try {
        const query = documentIds.map(encodeURIComponent).join(",")
        const res = await fetch(
          `/api/documents/preview-img-status/?document_ids=${query}`,
          {headers: headers}
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: PreviewStatusResponseItem[] = await res.json()
        setError(null)
        setIsLoading(false)

        setPreviews(prev => {
          const updated: Record<string, DocumentPreview> = {...prev}
          const changed: Record<string, DocumentPreview> = {}

          let complete = true

          data.forEach(({doc_id, status, preview_image_url}) => {
            const newPreview: DocumentPreview = {
              status,
              url: preview_image_url || null
            }

            const prevPreview = previousPreviewsRef.current[doc_id]
            updated[doc_id] = newPreview

            const justBecameReady =
              status === "ready" &&
              newPreview.url &&
              (!prevPreview ||
                prevPreview.status !== "ready" ||
                !prevPreview.url)

            if (justBecameReady) {
              changed[doc_id] = newPreview
            }

            if (status !== "ready") {
              complete = false
            }
          })

          previousPreviewsRef.current = updated
          setUpdatedPreviews(changed)
          setAllReady(complete)

          if (complete && intervalRef.current !== null) {
            clearInterval(intervalRef.current)
          }

          return updated
        })
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error("Unknown error")
        console.error("Polling error:", errorObj)
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

  return {
    previews,
    updatedPreviews,
    allReady,
    isLoading,
    error
  }
}

export default usePreviewPolling
