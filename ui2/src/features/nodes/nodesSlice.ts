import {RootState} from "@/app/types"
import type {NodeType, Paginated} from "@/types"
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
  }
})

export default nodesSlice.reducer

export const selectFoldersResult = (folderID: string) =>
  apiSliceWithNodes.endpoints.getFolder.select(folderID)

export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds

export const {selectEntities: selectNodeEntities} = nodeAdapter.getSelectors(
  (state: RootState) => state.nodes
)

export const selectNodesByIds = createSelector(
  [selectNodeEntities, selectItemIds],
  (entities, ids) => {
    return Object.values(entities).filter(i => ids.includes(i.id))
  }
)
