import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios';

const initialState = null

export const fetchCurrentUser = createAsyncThunk('api/users/me', async () => {
  const response = await axios.get('/api/users/me')
  return response.data
})


const currentUserSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      return action.payload
    })
  }
})

export default currentUserSlice.reducer

export const selectCurrentUser = (state: any) => state.currentUser

