import { fileManager } from "@/features/files/fileManager";
import client from "@/httpClient";
import { DocVerShort } from "@/types";
import { UUID } from "@/types.d/common";
import axios from "axios";
import { useEffect, useState } from "react";

interface State {
  isDownloading: boolean
  error?: string
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
    let resp = await client.get(
      `/api/documents/${docID}/last-version/`
    )

    if (resp.status !== 200) {
      return {
        ok: false,
        error: `Error downloading URL for ${docID}: ${resp.status}`
      }
    }

    const docVer: DocVerShort = resp.data

    resp = await client.get(docVer.download_url, { responseType: "blob" })
    if (resp.status !== 200) {
      return {
        ok: false,
        error: `Error downloading file from ${docVer.download_url}: ${resp.status}`
      }
    }

    return { ok: true, data: { docVerID: docVer.id, blob: resp.data } }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        ok: false,
        error: `Request failed: ${error.response?.status || 'Network error'} - ${error.message}`
      }
    }
    return {
      ok: false,
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

interface Args {
  docID?: UUID
  previewsAreAvailable: boolean
}

export default function useDownloadLastDocVerFile({ docID, previewsAreAvailable }: Args): State {
  const [isDownloading, setIsDownloading] = useState<boolean>(true)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    const downloadLastDocVer = async () => {

      if (!docID) {
        setIsDownloading(false)
        return
      }

      if (previewsAreAvailable) {
        setIsDownloading(false)
        return
      }

      try {
        setIsDownloading(true)
        setError(undefined)

        const { ok, data, error: downloadError } = await getDocLastVersion(docID)

        if (ok && data) {
          const arrayBuffer = await data.blob.arrayBuffer()
          fileManager.store({
            buffer: arrayBuffer,
            docVerID: data.docVerID
          })
        } else {
          setError(downloadError || 'Unknown download error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsDownloading(false)
      }
    }

    downloadLastDocVer()
  }, [docID]) // Added dependency array

  return { isDownloading, error }
}
