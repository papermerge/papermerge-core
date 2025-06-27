import {AppDispatch} from "@/app/types"
import {docVerPaginationUpdated} from "@/features/document/documentVersSlice"
import {DOC_VER_PAGINATION_PAGE_BATCH_SIZE} from "./constants"
import {
  generatePreviews,
  markGeneratingPreviewsBegin,
  markGeneratingPreviewsEnd
} from "./imageObjectsSlice"
import type {DocumentVersion} from "./types"

interface Args {
  docVer: DocumentVersion
  pageNumber: number
}

export const generateNextPreviews =
  ({docVer, pageNumber}: Args) =>
  async (dispatch: AppDispatch) => {
    dispatch(markGeneratingPreviewsBegin(docVer.id))

    await dispatch(
      generatePreviews({
        docVer,
        size: "md",
        pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
        pageNumber,
        pageTotal: docVer.pages.length
      })
    )

    dispatch(markGeneratingPreviewsEnd(docVer.id))

    dispatch(
      docVerPaginationUpdated({
        pageNumber: pageNumber,
        pageSize: DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
        docVerID: docVer.id
      })
    )
  }
