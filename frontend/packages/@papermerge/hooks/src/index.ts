import { useEffect, useRef, useState } from "react"

export type ImageStatus = "pending" | "ready" | "failed"

interface PreviewStatusResponseItem {
  doc_id: string
  status: ImageStatus
  preview_image_url: string | null
}

export type ImageResourceStatus = {
  doc_id: string
  status: ImageStatus | null
  url: string | null
}

interface Args {
  url: string,
  docIDs: string[],
  pollIntervalSeconds: number,
  maxRetries: number,
  headers: Record<string, string>
}

function toDocIdsQueryParams(docIds: string[]): string {
  const params = new URLSearchParams()
  docIds.forEach(id => params.append("doc_ids", id))
  return params.toString()
}

/*
  Polls given endpoint:

    GET URL?doc_ids=d1&doc_ids=d2&doc_ids=d3

  Responds of the endpoint is expected to be:

    [
      {
          "doc_id": "d1",
          "status": "pending",
          "preview_image_url": null
      },
      {
          "doc_id": "d2",
          "status": "pending",
          "preview_image_url": null
      },
      {
          "doc_id": "d3",
          "status": "pending",
          "preview_image_url": null
      }
    ]

  Polling stops when response list has all statuses set to "ready".
*/
export const useDocumentThumbnailPolling = ({
  url, docIDs, pollIntervalSeconds, maxRetries, headers
}: Args) => {
  const [previews, setPreviews] = useState<ImageResourceStatus[]>()
  const [pollingDocIDs, setPollingDocIDs] = useState<Array<string>>(docIDs)
  const intervalRef = useRef<number | null>(null)
  const retryCount = useRef<number>(maxRetries)
  const [error, setError] = useState<Error | null>(null)
  const [isPolling, setIsPolling] = useState<boolean>(false)

  const shouldStopPolling = () => {
    return retryCount.current !== null && retryCount.current >= maxRetries && intervalRef.current !== null
  }

  const retryCountInc = () => {
    if (retryCount.current !== null) {
      retryCount.current += 1
    }
    console.log(retryCount.current)
  }

  const retryCountReset = () => {
    if (retryCount.current !== null) {
      retryCount.current = 0
    }
  }

  const stopPolling = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    retryCountReset()
    setError(null)
    setIsPolling(false)
  }

  const poll = async () => {
    if (!docIDs || docIDs.length === 0) {
      stopPolling()
      return
    }

    if (shouldStopPolling()) {
      stopPolling()
      setError(new Error(`Failed to get thumbnails after ${maxRetries} retries`))
      return
    }

    retryCountInc()

    try {
      const queryString = toDocIdsQueryParams(docIDs)
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
      let stillPending: string[] = []

      data.forEach(({doc_id, status, preview_image_url}) => {
        newStats.push({
          doc_id: doc_id,
          status: status,
          url: preview_image_url
        })
        if (status != "ready") {
          complete = false
          stillPending.push(doc_id)
        }
      })

      setPollingDocIDs(stillPending)
      setPreviews(newStats)

      if (complete && intervalRef.current !== null) {
         stopPolling()
         return
      }

      if (stillPending.length === 0) {
        stopPolling()
      }

    } catch (err: unknown) {
      const errorObj = err instanceof Error ? err : new Error("Unknown error")
      setError(errorObj)
    }
  }

  useEffect(() => {
    setPollingDocIDs(docIDs)
  }, [docIDs])

  useEffect(() => {
    if (!docIDs || docIDs.length === 0) {
      stopPolling()
      return
    }

    setPollingDocIDs(docIDs)
    retryCountReset()
    setError(null)
    setIsPolling(true)

    poll()

    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(
        poll,
        pollIntervalSeconds * 1000
      )
    }

    return () => {
      stopPolling()
    }
  }, [docIDs])

   if (shouldStopPolling()) {
    const newError = new Error(
      `Failed to get thumbnails after ${maxRetries} retries`
    )

    return {
      previews,
      isPolling: false,
      error: newError,
      pollingDocIDs: pollingDocIDs
    }
  }

  return {previews, error, isPolling, pollingDocIDs}
};
