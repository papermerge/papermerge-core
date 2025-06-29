import {AppDispatch} from "@/app/types"
import {
  docVerPaginationUpdated,
  docVerThumbnailsPaginationUpdated
} from "@/features/document/documentVersSlice"
import {ImageSize} from "@/types.d/common"
import {
  DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
  DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
} from "./constants"
import {
  generatePreviews,
  markGeneratingPreviewsBegin,
  markGeneratingPreviewsEnd
} from "./imageObjectsSlice"
import type {DocumentVersion} from "./types"

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  size?: ImageSize
}

export const generateNextPreviews =
  ({docVer, pageNumber, size = "md"}: Args) =>
  async (dispatch: AppDispatch) => {
    dispatch(markGeneratingPreviewsBegin({docVerID: docVer.id, size}))

    const pageSize =
      size == "sm"
        ? DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
        : DOC_VER_PAGINATION_PAGE_BATCH_SIZE

    await dispatch(
      generatePreviews({
        docVer,
        size,
        pageSize: pageSize,
        pageNumber,
        pageTotal: docVer.pages.length
      })
    )

    dispatch(markGeneratingPreviewsEnd({docVerID: docVer.id, size}))

    if (size == "sm") {
      dispatch(
        docVerThumbnailsPaginationUpdated({
          pageNumber: pageNumber,
          pageSize: pageSize,
          docVerID: docVer.id
        })
      )
    } else {
      dispatch(
        docVerPaginationUpdated({
          pageNumber: pageNumber,
          pageSize: pageSize,
          docVerID: docVer.id
        })
      )
    }
  }
