import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"
import axios from "@/httpClient"
import type {SliceState, SliceStateStatus, User, UserDetails} from "@/types"

const initialState: SliceState<User> = {
  data: null,
  status: "idle",
  error: null
}

export const fetchCurrentUser = createAsyncThunk(
  "user/fetchCurrentUser",
  async () => {
    const response = await axios.get("/api/users/me")
    const userDetails = response.data as UserDetails
    return userDetails
  }
)

const currentUserSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchCurrentUser.pending, state => {
        state.status = "loading"
      })
      .addCase(
        fetchCurrentUser.fulfilled,
        (state, action: PayloadAction<UserDetails>) => {
          state.status = "succeeded"
          state.data = action.payload
        }
      )
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

export const selectCurrentUser = (state: any): User =>
  state.currentUser.data as User
export const selectCurrentUserStatus = (state: any): SliceStateStatus =>
  state.currentUser.status as SliceStateStatus
export const selectCurrentUserError = (state: any): string =>
  state.currentUser.error as string
