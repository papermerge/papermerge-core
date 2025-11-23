import { RootState } from "@/app/types"
import type { ObjectURLState } from "@/types.d/common"
import { createSelector } from "@reduxjs/toolkit"

export const selectThumbnailByNodeId = (
  state: RootState,
  node_id: string
): ObjectURLState | undefined => {
  return state.thumbnailObjects[node_id]
}

export const selectThumbnailObjects = (state: RootState) =>
  state.thumbnailObjects

export const selectFiles = (state: RootState) =>
  state.files.files

export const selectNodesWithoutExistingThumbnails = (node_ids: string[]) =>
  createSelector([selectThumbnailObjects, selectFiles], (thumbnailObjects, files) => {
    const notInThumbnails = (nodeID: string) => {
      return !thumbnailObjects[nodeID]
    }

    const notInFiles = (nodeID: string) => {
      return !files.find(n => n.nodeID == nodeID)
    }

    const result = node_ids.filter(
      node_id => notInThumbnails(node_id) && notInFiles(node_id)
    )
    return result
  })
