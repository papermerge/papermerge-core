import client from "@/httpClient"
import {ClientDocumentVersion, DocVerShort} from "@/types"
import {UUID} from "@/types.d/common"
import axios from "axios"
import {
  DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
  DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
} from "./constants"
import {DocumentVersion} from "./types"

export function clientDVFromDV(v: DocumentVersion): ClientDocumentVersion {
  let ver: ClientDocumentVersion = {
    id: v.id,
    lang: v.lang,
    number: v.number,
    file_name: v.file_name,
    pages: v.pages.map(p => {
      return {id: p.id, number: p.number, angle: 0}
    }),
    initial_pages: [...v.pages]
      .sort((a, b) => a.number - b.number)
      .map(p => {
        return {id: p.id, number: p.number, angle: 0}
      }),
    pagination: {
      page_number: 1,
      per_page: DOC_VER_PAGINATION_PAGE_BATCH_SIZE
    },
    thumbnailsPagination: {
      page_number: 1,
      per_page: DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
    }
  }

  return ver
}

export async function rotateImageObjectURL(
  objectURL: string,
  angleDegrees: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const angle = ((angleDegrees % 360) + 360) % 360
      const radians = (angle * Math.PI) / 180

      let canvas = document.createElement("canvas")
      let ctx = canvas.getContext("2d")
      if (!ctx) return reject(new Error("Failed to get canvas context"))

      // Determine new canvas dimensions
      if (angle === 90 || angle === 270) {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      // Move to center and rotate
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(radians)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      // Export rotated image as Blob
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error("Failed to convert canvas to Blob"))
        resolve(blob)
      }, "image/png")
    }

    img.onerror = e => reject(new Error("Image failed to load"))
    img.src = objectURL
  })
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

export async function getDocLastVersion(docID: UUID): Promise<ClientReturn> {
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
