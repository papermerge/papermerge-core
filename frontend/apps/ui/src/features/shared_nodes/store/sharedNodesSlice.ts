import {RootState} from "@/app/types"
import type {
  NodeType,
  ServerNotifDocumentMoved,
  ServerNotifDocumentsMoved
} from "@/types"
import {notifications} from "@mantine/notifications"
import {
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit"

interface DocumentThumbnailUpdated {
  document_id: string
  thumbnail_url: string | null
}

interface DocumentThumbnailErrorUpdated {
  document_id: string
  error: string
}

const sharedNodesAdapter = createEntityAdapter<NodeType>()
const initialState = sharedNodesAdapter.getInitialState()

const sharedNodesSlice = createSlice({
  name: "sharedNode",
  initialState,
  reducers: {
    documentThumbnailUpdated: (
      state,
      action: PayloadAction<DocumentThumbnailUpdated>
    ) => {
      const payload = action.payload
      const node = state.entities[payload.document_id]
      if (node && payload.thumbnail_url) {
        node.thumbnail_url = payload.thumbnail_url
      }
    },
    documentThumbnailErrorUpdated: (
      state,
      action: PayloadAction<DocumentThumbnailErrorUpdated>
    ) => {
      const payload = action.payload
      const node = state.entities[payload.document_id]
      if (node && payload.error) {
        node.thumbnail_preview_error = payload.error
      }
    },
    documentsMovedNotifReceived: (
      _state,
      action: PayloadAction<ServerNotifDocumentsMoved>
    ) => {
      const payload = action.payload

      notifications.show({
        withBorder: true,
        message: `${payload.count} were documents path was updated based on new ${payload.document_type_name} path template`
      })
    },
    documentMovedNotifReceived: (
      _state,
      action: PayloadAction<ServerNotifDocumentMoved>
    ) => {
      const payload = action.payload

      notifications.show({
        withBorder: true,
        message: `Document ${payload.new_document_title} moved to new folder (based on custom field changes)`
      })
    }
  }
})

export const {
  documentsMovedNotifReceived,
  documentMovedNotifReceived,
  documentThumbnailUpdated,
  documentThumbnailErrorUpdated
} = sharedNodesSlice.actions

export default sharedNodesSlice.reducer

export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds

export const {selectEntities: selectNodeEntities, selectById: selectNodeById} =
  sharedNodesAdapter.getSelectors((state: RootState) => state.sharedNodes)

export const selectNodesByIds = createSelector(
  [selectNodeEntities, selectItemIds],
  (entities, ids) => {
    return Object.values(entities).filter(i => ids.includes(i.id))
  }
)
