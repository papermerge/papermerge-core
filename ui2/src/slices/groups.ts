import {
  createSlice,
  createAsyncThunk,
  createEntityAdapter
} from "@reduxjs/toolkit"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import axios from "axios"

import {RootState} from "@/app/types"
import type {Group, Paginated} from "@/types"

const groupsAdapter = createEntityAdapter({
  selectId: (group: Group) => group.id,
  sortComparer: (g1, g2) => g1.name.localeCompare(g2.name)
})

const initialState = groupsAdapter.getInitialState({
  status: "idle",
  error: null
})

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {},
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

export default groupsSlice.reducer

export const {selectAll: selectAllGroups, selectById: selectGroupById} =
  groupsAdapter.getSelectors<RootState>(state => state.groups)
