import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter,
  PayloadAction
} from "@reduxjs/toolkit"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import axios from "axios"

import {RootState} from "@/app/types"
import type {Group, Paginated, SliceStateStatus, SliceStateError} from "@/types"

const groupsAdapter = createEntityAdapter({
  selectId: (group: Group) => group.id,
  sortComparer: (g1, g2) => g1.name.localeCompare(g2.name)
})

type ExtraStateType = {
  status: SliceStateStatus
  error: SliceStateError
  selectedIds: Array<number>
}

const extraState: ExtraStateType = {
  status: "idle",
  error: null,
  selectedIds: []
}

const initialState = groupsAdapter.getInitialState(extraState)

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    selectionAdd: (state, action: PayloadAction<number>) => {
      state.selectedIds.push(action.payload)
    },
    selectionRemove: (state, action: PayloadAction<number>) => {
      const newSelectedIds = state.selectedIds.filter(i => i != action.payload)
      state.selectedIds = newSelectedIds
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchGroups.fulfilled, groupsAdapter.setAll)
  }
})

export const fetchGroups = createAsyncThunk("groups/fetchGroups", async () => {
  const rest_api_url = getRestAPIURL()
  const defaultHeaders = getDefaultHeaders()

  const response = await axios.get(`${rest_api_url}/api/groups/`, {
    headers: defaultHeaders
  })
  const data = response.data as Paginated<Group>
  return data.items
})

export const {selectionAdd, selectionRemove} = groupsSlice.actions
export default groupsSlice.reducer

export const {selectAll: selectAllGroups, selectById: selectGroupById} =
  groupsAdapter.getSelectors<RootState>(state => state.groups)

export const selectSelectedIds = (state: RootState) => state.groups.selectedIds
