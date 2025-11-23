import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import type {
  NodeType,
  Paginated,
  ServerErrorType,
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
import {apiSliceWithNodes} from "./api"

const nodeAdapter = createEntityAdapter<NodeType>()
const initialState = nodeAdapter.getInitialState()

interface DocumentThumbnailUpdated {
  document_id: string
  thumbnail_url: string | null
}

interface DocumentThumbnailErrorUpdated {
  document_id: string
  error: string
}

const nodesSlice = createSlice({
  name: "nodes",
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
  },
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithNodes.endpoints.getPaginatedNodes.matchFulfilled,
      (state, action: PayloadAction<Paginated<NodeType>>) => {
        const payload = action.payload
        nodeAdapter.addMany(state, payload.items)
      }
    )
    builder.addMatcher(
      apiSliceWithNodes.endpoints.renameFolder.matchFulfilled,
      (state, action: PayloadAction<NodeType>) => {
        const payload = action.payload
        nodeAdapter.setOne(state, payload)
      }
    )
  }
})

export const {
  documentsMovedNotifReceived,
  documentMovedNotifReceived,
  documentThumbnailUpdated,
  documentThumbnailErrorUpdated
} = nodesSlice.actions

export default nodesSlice.reducer

export const selectFoldersResult = (folderID: string) =>
  apiSliceWithNodes.endpoints.getFolder.select(folderID)

export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds

export const {selectEntities: selectNodeEntities, selectById: selectNodeById} =
  nodeAdapter.getSelectors((state: RootState) => state.nodes)

export const selectNodesByIds = createSelector(
  [selectNodeEntities, selectItemIds],
  (entities, ids) => {
    return Object.values(entities).filter(i => ids.includes(i.id))
  }
)

export const selectDocumentThumbnailURL = (
  state: RootState,
  nodeID: string
): null | string => {
  const node =
    state.nodes.entities[nodeID] || state.sharedNodes.entities[nodeID]

  if (!node) {
    return null
  }

  if (!node.thumbnail_url) {
    return null
  }

  return node.thumbnail_url
}

export const selectDocumentThumbnailError = (
  state: RootState,
  nodeID: string
): null | string => {
  const node =
    state.nodes.entities[nodeID] || state.sharedNodes.entities[nodeID]

  if (!node) {
    return null
  }

  return node.thumbnail_preview_error
}

export const moveNodesListeners = (startAppListening: AppStartListening) => {
  startAppListening({
    matcher: apiSliceWithNodes.endpoints.moveNodes.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: "Nodes successfully moved"
      })
    }
  })

  startAppListening({
    matcher: apiSliceWithNodes.endpoints.moveNodes.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: "Error",
        message: error.data.detail
      })
    }
  })
}
