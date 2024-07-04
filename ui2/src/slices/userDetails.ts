import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"
import axios from "axios"

import {RootState} from "@/app/types"
import type {SliceState, UserDetails} from "@/types"

const initialState: SliceState<UserDetails> = {
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
    },
    updateUserDetails: (state, action: PayloadAction<UserDetails>) => {
      state.data = action.payload
      state.error = null
      state.status = "succeeded"
    }
  },
  extraReducers(builder) {
    builder.addCase(
      fetchUserDetails.fulfilled,
      (state, action: PayloadAction<UserDetails>) => {
        state.data = action.payload
        state.error = null
        state.status = "succeeded"
      }
    )
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

export const fetchUserDetails = createAsyncThunk<UserDetails, string>(
  "user/fetchUserDetails",
  async (modelId: string) => {
    const response = await axios.get(`/api/users/${modelId}`)
    const data = response.data as UserDetails
    return data
  }
)

type ChangePasswordArgs = {
  userId: string
  password: string
}

export const changePassword = createAsyncThunk<UserDetails, ChangePasswordArgs>(
  "user/changePassword",
  async (args: ChangePasswordArgs) => {
    const response = await axios.post(
      `/api/users/${args.userId}/change-password/`,
      {password: args.password}
    )
    const data = response.data as UserDetails
    return data
  }
)

export const {clearUserDetails, updateUserDetails} = userSlice.actions
export default userSlice.reducer

export const selectUserDetails = (
  state: RootState
): SliceState<UserDetails> => {
  return state.userDetails
}
