import {useEffect, useRef, useState} from "react"

// Define the shape of each document preview
interface DocumentPreview {
  status: string
  url: string | null
}

// Define the response format from your backend
interface PreviewStatusResponseItem {
  doc_id: string
  status: string
  preview_image_url: string | null
}

// Hook options
interface UsePreviewPollingOptions {
  pollIntervalMs?: number
  maxRetries?: number
}

// Return value of the hook
interface UsePreviewPollingResult {
  previews: Record<string, DocumentPreview>
  allReady: boolean
  isLoading: boolean
  error: Error | null
}

const usePreviewPolling = (
  documentIds: string[],
  {pollIntervalMs = 3000, maxRetries = 20}: UsePreviewPollingOptions = {}
): UsePreviewPollingResult => {
  const [previews, setPreviews] = useState<Record<string, DocumentPreview>>({})
  const [allReady, setAllReady] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const retryCount = useRef<number>(0)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (!documentIds || documentIds.length === 0) return

    const pollPreviewStatuses = async () => {
      try {
        const query = documentIds.map(encodeURIComponent).join(",")
        const res = await fetch(
          `/api/documents/preview-img-status/?document_ids=${query}`
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: PreviewStatusResponseItem[] = await res.json()
        setError(null)
        setIsLoading(false)

        setPreviews(prev => {
          const updated: Record<string, DocumentPreview> = {...prev}
          let complete = true

          for (const {doc_id, status, preview_image_url} of data) {
            updated[doc_id] = {
              status,
              url: preview_image_url || null
            }
            if (status !== "ready") {
              complete = false
            }
          }

          setAllReady(complete)
          if (complete && intervalRef.current) {
            clearInterval(intervalRef.current)
          }

          return updated
        })
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error("Unknown error")
        console.error("Polling error:", errorObj)
        setError(errorObj)
        retryCount.current += 1

        if (retryCount.current >= maxRetries && intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }

    pollPreviewStatuses() // Initial call
    intervalRef.current = setInterval(pollPreviewStatuses, pollIntervalMs)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [documentIds, pollIntervalMs, maxRetries])

  return {previews, allReady, isLoading, error}
}

export default usePreviewPolling
