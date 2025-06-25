import {useAppDispatch} from "@/app/hooks"
import useAreAllPreviewsAvailable from "@/features/document/hooks/useAreAllPreviewsAvailable"
import {generatePreviews} from "@/features/document/imageObjectsSlice"
import type {DocumentVersion} from "@/features/document/types"
import {fileManager} from "@/features/files/fileManager"
import client from "@/httpClient"
import {DocVerShort} from "@/types"
import {UUID} from "@/types.d/common"
import axios from "axios"
import {useEffect} from "react"

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  pageSize: number
}

export default function useGeneratePreviews({
  docVer,
  pageSize,
  pageNumber
}: Args): void {
  const dispatch = useAppDispatch()
  const allPreviewsAreAvailable = useAreAllPreviewsAvailable({
    docVer,
    pageSize,
    pageNumber
  })

  useEffect(() => {
    const generate = async () => {
      if (!allPreviewsAreAvailable) {
        if (!fileManager.getByDocVerID(docVer.id)) {
          const {
            ok,
            data,
            error: downloadError
          } = await getDocLastVersion(docVer.document_id)
          if (ok && data) {
            const arrayBuffer = await data.blob.arrayBuffer()
            fileManager.store({
              buffer: arrayBuffer,
              docVerID: data.docVerID
            })
          } else {
            console.error(downloadError || "Unknown download error")
            return
          }
        }
        dispatch(
          generatePreviews({
            docVer,
            size: "md",
            pageSize,
            pageNumber,
            pageTotal: docVer.pages.length
          })
        )
      }
    }

    generate()
  }, [dispatch, docVer, pageSize, pageNumber, allPreviewsAreAvailable])
}

interface DocData {
  blob: Blob
  docVerID: UUID
}

interface ClientReturn {
  ok: boolean
  error?: string
  data?: DocData
}

async function getDocLastVersion(docID: UUID): Promise<ClientReturn> {
  try {
    let resp = await client.get(`/api/documents/${docID}/last-version/`)

    if (resp.status !== 200) {
      return {
        ok: false,
        error: `Error downloading URL for ${docID}: ${resp.status}`
      }
    }

    const docVer: DocVerShort = resp.data

    resp = await client.get(docVer.download_url, {responseType: "blob"})
    if (resp.status !== 200) {
      return {
        ok: false,
        error: `Error downloading file from ${docVer.download_url}: ${resp.status}`
      }
    }

    return {ok: true, data: {docVerID: docVer.id, blob: resp.data}}
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        ok: false,
        error: `Request failed: ${error.response?.status || "Network error"} - ${error.message}`
      }
    }
    return {
      ok: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`
    }
  }
}
