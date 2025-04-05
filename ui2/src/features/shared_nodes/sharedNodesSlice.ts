import {RootState} from "@/app/types"
import type {
  NodeType,
  Paginated,
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
import {apiSliceWithSharedNodes} from "./apiSlice"

const sharedNodesAdapter = createEntityAdapter<NodeType>()
const initialState = sharedNodesAdapter.getInitialState()

const sharedNodesSlice = createSlice({
  name: "sharedNode",
  initialState,
  reducers: {
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
      apiSliceWithSharedNodes.endpoints.getPaginatedSharedNodes.matchFulfilled,
      (state, action: PayloadAction<Paginated<NodeType>>) => {
        const payload = action.payload
        sharedNodesAdapter.addMany(state, payload.items)
      }
    )
  }
})

export const {documentsMovedNotifReceived, documentMovedNotifReceived} =
  sharedNodesSlice.actions

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
