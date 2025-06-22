import { fileManager } from "@/features/files/fileManager";
import client from "@/httpClient";
import { DocVerShort } from "@/types";
import { UUID } from "@/types.d/common";
import { getBaseURL } from "@/utils";
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
  let resp = await client.get(
    `${getBaseURL()}/api/documents/${docID}/last-version/`
  )

  if (resp.status != 200) {
    return {
      ok: false,
      error: `Error downloading URL for ${docID}`
    }
  }

  const docVer: DocVerShort = resp.data

  resp = await client.get(docVer.download_url, { responseType: "blob" })
  if (resp.status != 200) {
    return {
      ok: false,
      error: `Error downloading file from ${docVer.download_url}`
    }
  }

  return { ok: true, data: { docVerID: docVer.id, blob: resp.data } }
}



export default function useDownloadLastDocVer(docID: UUID): State {
  const [isDownloading, setIsDownloading] = useState<boolean>(true)

  useEffect(() => {

    const downloadLastDocVer = async () => {
      const { ok, data } = await getDocLastVersion(docID)
      if (ok && data) {
        const arrayBuffer = await data.blob.arrayBuffer();
        fileManager.store({
          buffer: arrayBuffer,
          docVerID: data.docVerID
        })
      }
    }

    downloadLastDocVer()

    setIsDownloading(false)
  })

  return { isDownloading }
}
