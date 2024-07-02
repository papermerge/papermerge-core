import {createSlice, createAsyncThunk} from "@reduxjs/toolkit"
import axios from "axios"

import {RootState} from "@/app/types"
import type {User, SliceState} from "@/types"

const initialState: SliceState<User> = {
  data: null,
  status: "idle",
  error: null
}

const userSlice = createSlice({
  name: "userDetails",
  initialState,
  reducers: {
    clearUserDetails: state => {
      state.data = null
      state.status = "idle"
      state.error = null
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchUserDetails.fulfilled, (state, action) => {
      state.data = action.payload
      state.error = null
      state.status = "succeeded"
    })
    builder.addCase(fetchUserDetails.pending, state => {
      state.data = null
      state.error = null
      state.status = "loading"
    })
    builder.addCase(fetchUserDetails.rejected, state => {
      state.data = null
      state.error = "Error"
      state.status = "failed"
    })
  }
})

export const fetchUserDetails = createAsyncThunk<User, string>(
  "user/fetchUserDetails",
  async (modelId: string) => {
    const response = await axios.get(`/api/users/${modelId}`)
    const data = response.data as User
    return data
  }
)

export const {clearUserDetails} = userSlice.actions
export default userSlice.reducer

export const selectUserDetails = (state: RootState): SliceState<User> => {
  return state.userDetails
}
