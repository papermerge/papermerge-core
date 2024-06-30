import {createSlice, createAsyncThunk} from "@reduxjs/toolkit"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import axios from "axios"

import {RootState} from "@/app/types"
import type {
  NewGroup,
  Group,
  Paginated,
  SliceStateStatus,
  SliceStateError,
  SliceState
} from "@/types"

const initialState: SliceState<Group> = {
  data: null,
  status: "idle",
  error: null
}

const groupsSlice = createSlice({
  name: "groupDetails",
  initialState,
  reducers: {
    clearGroupDetails: state => {
      state.data = null
      state.status = "idle"
      state.error = null
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchGroupDetails.fulfilled, (state, action) => {
      state.data = action.payload
      state.error = null
      state.status = "succeeded"
    })
    builder.addCase(fetchGroupDetails.pending, (state, action) => {
      state.data = null
      state.error = null
      state.status = "loading"
    })
    builder.addCase(fetchGroupDetails.rejected, (state, action) => {
      state.data = null
      state.error = "Error"
      state.status = "failed"
    })
  }
})

export const fetchGroupDetails = createAsyncThunk<Group, number>(
  "group/fetchGroupDetails",
  async (groupId: number) => {
    const rest_api_url = getRestAPIURL()
    const defaultHeaders = getDefaultHeaders()

    const response = await axios.get(`${rest_api_url}/api/groups/${groupId}`, {
      headers: defaultHeaders
    })
    const data = response.data as Group
    return data
  }
)

export const {clearGroupDetails} = groupsSlice.actions
export default groupsSlice.reducer

export const selectGroupDetails = (state: RootState): SliceState<Group> => {
  return state.groupDetails
}
