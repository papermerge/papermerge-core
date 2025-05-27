import { useEffect, useRef, useState } from "react"

export type ImageStatus = "pending" | "ready" | "failed"

interface PreviewStatusResponseItem {
  doc_id: string
  status: ImageStatus
  preview_image_url: string | null
}

type ImageResourceStatus = {
  doc_id: string
  status: ImageStatus | null
  url: string | null
}

interface Args {
  url: string,
  docIDs: string[],
  pollIntervalSec: number,
  maxRetries: number,
  headers: Record<string, string>
}

function toDocIdsQueryParams(docIds: string[]): string {
  const params = new URLSearchParams()
  docIds.forEach(id => params.append("doc_ids", id))
  return params.toString()
}

export const useDocumentThumbnailPolling = ({
  url, docIDs, pollIntervalSec, maxRetries, headers
}: Args) => {
  const [imageResourceStatus, setImageResourceStatus] = useState<ImageResourceStatus[]>()
  const [retryCount, setRetryCount] = useState<number>(0)
  const [pollingDocIDs, setPollingDocIDs] = useState<Array<string>>(docIDs)
  const intervalRef = useRef<number | null>(null)
  const [error, setError] = useState<Error | null>(null)


  const shouldStopPolling = () => {
    return retryCount >= maxRetries && intervalRef.current !== null
  }

  const stopPolling = () => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setRetryCount(0)
  }

  const poll = async () => {
    try {
      const queryString = toDocIdsQueryParams(pollingDocIDs)
      const res = await fetch(
        `${url}?${queryString}`,
        {headers: headers}
      )
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data: PreviewStatusResponseItem[] = await res.json()
      let complete = true
      let newStats: ImageResourceStatus[] = []
      let newDocIDs: string[] = []

      data.forEach(({doc_id, status, preview_image_url}) => {

        if (status == "ready") {
          newStats.push({
            doc_id: doc_id,
            status: status,
            url: preview_image_url
          })
        } else {
          complete = false
          newDocIDs.push(doc_id)
        }

      })

      if (complete && intervalRef.current !== null) {
         stopPolling()
         return
      }

      setRetryCount(retryCount + 1)
      setPollingDocIDs(newDocIDs)
      setImageResourceStatus(newStats)

    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error("Unknown error")
      setError(errorObj)
      setRetryCount(retryCount + 1)
      if (shouldStopPolling()) {
        stopPolling()
      }
    }
  }

  useEffect(() => {
    if (!docIDs || docIDs.length === 0) {
      return
    }

    if (intervalRef.current != null) {
      return
    }

    if (intervalRef.current == null) {
      intervalRef.current = window.setInterval(
        poll,
        pollIntervalSec
      )
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [docIDs])

   if (retryCount > maxRetries) {
    const newError = new Error(
      `Failed to get thumbnails after ${maxRetries} retries`
    )

    return {
      imageResources: imageResourceStatus,
      error: newError
    }
  }

  return {
    imageResources: imageResourceStatus,
    error: error
  }
};
