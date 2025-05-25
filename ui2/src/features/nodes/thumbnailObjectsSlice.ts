import type {UUID} from "@/types.d/common"
import type {LoadThumbnailInputType} from "@/types.d/node_thumbnail"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

interface ThumbnailState {
  [node_id: UUID]: string
}

const initialState: ThumbnailState = {}

interface PayloadType {
  node_id: UUID
  objectURL: string
}

export const loadThumbnail = createAsyncThunk<
  PayloadType | null, // 1. Return type of payload (fulfilled result)
  LoadThumbnailInputType // 2. Argument passed into the thunk
>("images/loadThumbnail", async item => {
  const headers = getDefaultHeaders()
  let url

  if (!item.url) {
    return null
  }

  if (item.status != "ready") {
    return null
  }

  if (item.url && !item.url.startsWith("/api/")) {
    // cloud URL e.g. aws cloudfront URL
    url = item.url
  } else {
    // use backend server URL (which may differ from frontend's URL)
    url = `${getBaseURL(true)}${item.url}`
  }

  const response = await fetch(url, {headers: headers})
  const blob = await response.blob()
  const objectURL = URL.createObjectURL(blob)
  const result = {
    node_id: item.node_id as UUID,
    objectURL
  }

  return result
})

const thumbnailObjectsSlice = createSlice({
  name: "thumbnailObjects",
  initialState,
  reducers: {
    clearImages(state) {
      for (const sizes of Object.values(state)) {
        for (const url of Object.values(sizes)) {
          if (url) URL.revokeObjectURL(url)
        }
      }
      return {}
    }
  },
  extraReducers: builder => {
    builder.addCase(loadThumbnail.fulfilled, (state, action) => {
      const payload = action.payload

      if (payload) {
        const node_id = payload.node_id as UUID
        const newObjectURL = payload.objectURL
        const existingObjectURL = state[node_id]

        if (existingObjectURL) {
          URL.revokeObjectURL(existingObjectURL)
        }

        state[node_id] = newObjectURL
      }
    })
  }
})

export const {clearImages} = thumbnailObjectsSlice.actions
export default thumbnailObjectsSlice.reducer
