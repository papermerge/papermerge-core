import {RootState} from "@/app/types"
import type {NodeType} from "@/types"
import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit"
import {apiSliceWithSearch} from "./apiSlice"

interface SearchSlice {
  /* Store here node details. Node details from this slice
  are used to render breadcrumb and colored tags of search results.
  Although it uses same `NodeType` structure as in `nodes` slice,
  the results are slightly different as `search.nodes` slice contains
  full breadcrumb.
  */
  nodes: EntityState<NodeType, string>
}

const nodeAdapter = createEntityAdapter<NodeType>()
const initialState: SearchSlice = {
  nodes: nodeAdapter.getInitialState()
}

const nodesSlice = createSlice({
  name: "search",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithSearch.endpoints.getNodes.matchFulfilled,
      (state, action: PayloadAction<NodeType[]>) => {
        const payload = action.payload
        console.log(payload)
        nodeAdapter.addMany(state.nodes, payload)
      }
    )
  }
})

export default nodesSlice.reducer

export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds

export const selectNodeById = (state: RootState, id: string) =>
  state.search.nodes.entities[id]
