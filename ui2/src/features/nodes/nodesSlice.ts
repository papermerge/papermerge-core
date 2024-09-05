import {
  createSelector,
  createEntityAdapter,
  createSlice,
  PayloadAction
} from "@reduxjs/toolkit"
import {RootState} from "@/app/types"
import {apiSliceWithNodes} from "./apiSlice"
import type {NodeType, Paginated} from "@/types"

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
        nodeAdapter.upsertMany(state, payload.items)
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
