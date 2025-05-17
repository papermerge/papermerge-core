import {AppThunk} from "@/app/types" // adjust based on your setup
import {
  documentThumbnailErrorUpdated,
  documentThumbnailUpdated
} from "@/features/nodes/nodesSlice"
import {
  documentThumbnailErrorUpdated as sharedNodesdocumentThumbnailErrorUpdated,
  documentThumbnailUpdated as sharedNodesdocumentThumbnailUpdated
} from "@/features/shared_nodes/sharedNodesSlice"

export const updateAllThumbnails =
  (document_id: string, thumbnail_url: string | null): AppThunk =>
  dispatch => {
    dispatch(
      documentThumbnailUpdated({
        document_id: document_id,
        thumbnail_url: thumbnail_url
      })
    )
    dispatch(
      sharedNodesdocumentThumbnailUpdated({
        document_id: document_id,
        thumbnail_url: thumbnail_url
      })
    )
  }

export const updateErrorAllThumbnails =
  (docId: string, error: string): AppThunk =>
  dispatch => {
    dispatch(
      documentThumbnailErrorUpdated({
        document_id: docId,
        error: error
      })
    )
    dispatch(
      sharedNodesdocumentThumbnailErrorUpdated({
        document_id: docId,
        error: error
      })
    )
  }
