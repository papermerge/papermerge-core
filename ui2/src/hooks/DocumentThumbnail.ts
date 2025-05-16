import {useAppSelector} from "@/app/hooks"
import {
  selectDocumentThumbnailError,
  selectDocumentThumbnailURL
} from "@/features/nodes/nodesSlice"
import {getBaseURL, getDefaultHeaders, imageEncode} from "@/utils"
import {useEffect, useState} from "react"

interface Args {
  nodeID: string
}

type ThumbnailState = {
  data: string | null
  isLoading: boolean
  isError: boolean
  error: string | null
}

export default function useDocumentThumbnail({nodeID}: Args) {
  const [state, setState] = useState<ThumbnailState>({
    data: null,
    isLoading: true,
    isError: false,
    error: null
  })
  const thumbnail_url = useAppSelector(s =>
    selectDocumentThumbnailURL(s, nodeID)
  )
  const thumbnail_error = useAppSelector(s =>
    selectDocumentThumbnailError(s, nodeID)
  )
  const headers = getDefaultHeaders()
  let url: string

  useEffect(() => {
    if (thumbnail_error) {
      setState({
        data: null,
        isLoading: false,
        isError: true,
        error: thumbnail_error
      })
      return
    }
  }, [thumbnail_error])

  useEffect(() => {
    let isMounted = true
    if (!thumbnail_url) {
      if (isMounted) {
        setState({data: null, isLoading: true, isError: false, error: null})
      }
      return
    }

    if (thumbnail_url && !thumbnail_url.startsWith("/api/")) {
      // cloud URL e.g. aws cloudfront URL
      url = thumbnail_url
    } else {
      // use backend server URL (which may differ from frontend's URL)
      url = `${getBaseURL(true)}${thumbnail_url}`
    }

    const fetchThumbnail = async () => {
      try {
        const response = await fetch(url, {headers: headers})
        const resp2 = await response.arrayBuffer()
        const encodedData = imageEncode(resp2, "image/jpeg")

        if (isMounted) {
          setState({
            data: encodedData,
            isLoading: false,
            isError: false,
            error: null
          })
        }
      } catch (err) {
        if (isMounted) {
          setState({
            data: null,
            isLoading: false,
            isError: true,
            error: (err as Error).message
          })
        }
      }
    }

    fetchThumbnail()

    return () => {
      isMounted = false
    }
  }, [thumbnail_url])

  return state
}
