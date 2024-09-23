import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {apiSliceWithSearch} from "@/features/search/apiSlice"
import type {NodeType, Paginated, ServerErrorType} from "@/types"
import {notifications} from "@mantine/notifications"
import {
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit"
import {apiSliceWithNodes} from "./apiSlice"

const nodeAdapter = createEntityAdapter<NodeType>()
const initialState = nodeAdapter.getInitialState()

const nodesSlice = createSlice({
  name: "nodes",
  initialState,
  reducers: {},
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
    builder.addMatcher(
      apiSliceWithSearch.endpoints.getNodes.matchFulfilled,
      (state, action: PayloadAction<NodeType[]>) => {
        const payload = action.payload
        nodeAdapter.addMany(state, payload)
      }
    )
  }
})

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
