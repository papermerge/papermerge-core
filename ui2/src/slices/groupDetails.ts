import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"
import axios from "axios"

import {RootState} from "@/app/types"
import type {Group, GroupDetails, SliceState} from "@/types"

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
    },
    updateGroupDetails: (state, action: PayloadAction<GroupDetails>) => {
      state.data = action.payload
      state.error = null
      state.status = "succeeded"
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchGroupDetails.fulfilled, (state, action) => {
      state.data = action.payload
      state.error = null
      state.status = "succeeded"
    })
    builder.addCase(fetchGroupDetails.pending, state => {
      state.data = null
      state.error = null
      state.status = "loading"
    })
    builder.addCase(fetchGroupDetails.rejected, state => {
      state.data = null
      state.error = "Error"
      state.status = "failed"
    })
  }
})

export const fetchGroupDetails = createAsyncThunk<Group, number>(
  "group/fetchGroupDetails",
  async (groupId: number) => {
    const response = await axios.get(`/api/groups/${groupId}`)
    const data = response.data as Group
    return data
  }
)

export const {clearGroupDetails, updateGroupDetails} = groupsSlice.actions
export default groupsSlice.reducer

export const selectGroupDetails = (state: RootState): SliceState<Group> => {
  return state.groupDetails
}
