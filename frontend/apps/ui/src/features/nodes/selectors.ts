import {RootState} from "@/app/types"
import type {ObjectURLState} from "@/types.d/common"
import {createSelector} from "@reduxjs/toolkit"

export const selectThumbnailByNodeId = (
  state: RootState,
  node_id: string
): ObjectURLState | undefined => {
  return state.thumbnailObjects[node_id]
}

export const selectThumbnailObjects = (state: RootState) =>
  state.thumbnailObjects

export const selectNodesWithoutExistingThumbnails = (node_ids: string[]) =>
  createSelector([selectThumbnailObjects], thumbnailObjects => {
    const result = node_ids.filter(node_id => !thumbnailObjects[node_id])
    return result
  })
