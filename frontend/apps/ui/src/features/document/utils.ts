import {ClientDocumentVersion} from "@/types"
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
