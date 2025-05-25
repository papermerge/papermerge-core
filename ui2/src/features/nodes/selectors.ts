import {RootState} from "@/app/types"
import {createSelector} from "@reduxjs/toolkit"

export const selectThumbnailByNodeId = (
  state: RootState,
  node_id: string
): string | undefined => {
  return state.thumbnailObjects[node_id]
}

export const selectThumbnailObjects = (state: RootState) =>
  state.thumbnailObjects

export const selectNodesWithoutExistingThumbnails = (node_ids: string[]) =>
  createSelector([selectThumbnailObjects], thumbnailObjects =>
    node_ids.filter(node_id => !thumbnailObjects[node_id])
  )
