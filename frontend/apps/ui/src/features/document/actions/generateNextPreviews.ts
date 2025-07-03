import {AppDispatch} from "@/app/types"
import {
  DOC_VER_PAGINATION_PAGE_BATCH_SIZE,
  DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
} from "@/features/document/constants"
import {
  docVerPaginationUpdated,
  docVerThumbnailsPaginationUpdated
} from "@/features/document/documentVersSlice"
import {
  generatePreviews,
  markGeneratingPreviewsBegin,
  markGeneratingPreviewsEnd
} from "@/features/document/imageObjectsSlice"
import type {DocumentVersion} from "@/features/document/types"
import {ImageSize} from "@/types.d/common"

interface Args {
  docVer: DocumentVersion
  pageNumber: number
  size?: ImageSize
}

export const generateNextPreviews =
  ({docVer, pageNumber, size = "md"}: Args) =>
  async (dispatch: AppDispatch) => {
    /*
    console.log(
      `generateNextPreviews: mark BRGIN of gen docVerID=${docVer.id} size=${size}`
    )
    */
    dispatch(markGeneratingPreviewsBegin({docVerID: docVer.id, size}))

    const pageSize =
      size == "sm"
        ? DOC_VER_PAGINATION_THUMBNAIL_BATCH_SIZE
        : DOC_VER_PAGINATION_PAGE_BATCH_SIZE

    /*
    console.log(
      `generateNextPreviews: gen size=${size} pageNumber=${pageNumber}`
    )
    */
    await dispatch(
      generatePreviews({
        docVer,
        size,
        pageSize: pageSize,
        pageNumber,
        pageTotal: docVer.pages.length
      })
    )
    /*
    console.log(
      `generateNextPreviews: mark END of gen docVerID=${docVer.id} size=${size}`
    )
    */
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
