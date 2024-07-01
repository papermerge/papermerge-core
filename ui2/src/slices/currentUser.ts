import {createSlice, createAsyncThunk} from "@reduxjs/toolkit"
import axios from "@/httpClient"
import type {SliceState, User} from "@/types"

const initialState: SliceState<User> = {
  data: null,
  status: "idle",
  error: null
}

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async () => {
    const response = await axios.get("/api/users/me")

    return response.data
  }
)

const currentUserSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchCurrentUser.pending, (state, action) => {
        state.status = "loading"
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded"
        state.data = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed"
        const message =
          `PM-0001: Client failed to retrieve current user from '/api/users/me' endpoint.` +
          ` Ax message: ${action.error.message}.` +
          ` Ax code: ${action.error.code}.`
        state.error = message
      })
  }
})

export default currentUserSlice.reducer

export const selectCurrentUser = (state: any) => state.currentUser.data
export const selectCurrentUserStatus = (state: any) => state.currentUser.status
export const selectCurrentUserError = (state: any) => state.currentUser.error
