import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"
import axios from "axios"

import {RootState} from "@/app/types"
import type {ColoredTagType, SliceState} from "@/types"

const initialState: SliceState<ColoredTagType> = {
  data: null,
  status: "idle",
  error: null
}

const tagsSlice = createSlice({
  name: "tagDetails",
  initialState,
  reducers: {
    clearTagDetails: state => {
      state.data = null
      state.status = "idle"
      state.error = null
    },
    updateTagDetails: (state, action: PayloadAction<ColoredTagType>) => {
      state.data = action.payload
      state.error = null
      state.status = "succeeded"
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchTagDetails.fulfilled, (state, action) => {
      state.data = action.payload
      state.error = null
      state.status = "succeeded"
    })
    builder.addCase(fetchTagDetails.pending, state => {
      state.data = null
      state.error = null
      state.status = "loading"
    })
    builder.addCase(fetchTagDetails.rejected, state => {
      state.data = null
      state.error = "Error"
      state.status = "failed"
    })
  }
})

export const fetchTagDetails = createAsyncThunk<ColoredTagType, string>(
  "tag/fetchTagDetails",
  async (tagId: string) => {
    const response = await axios.get(`/api/tags/${tagId}`)
    const data = response.data as ColoredTagType
    return data
  }
)

export const {clearTagDetails, updateTagDetails} = tagsSlice.actions
export default tagsSlice.reducer

export const selectTagDetails = (
  state: RootState
): SliceState<ColoredTagType> => {
  return state.tagDetails
}
