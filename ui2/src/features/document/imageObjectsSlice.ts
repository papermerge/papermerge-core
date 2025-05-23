import type {
  PageImageSize,
  ProgressiveImageInputType
} from "@/types.d/page_image"
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

interface ImageState {
  [page_id: string]: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
  }
}

const initialState: ImageState = {}

interface PayloadType {
  page_id: string
  objectURL: string
  size: PageImageSize
}

export const preloadProgressiveImages = createAsyncThunk<
  PayloadType[], // 1. Return type of payload (fulfilled result)
  ProgressiveImageInputType // 2. Argument passed into the thunk
>("images/preloadProgressiveImages", async imageWithURLs => {
  const results: PayloadType[] = []

  for (const preview of imageWithURLs.previews) {
    if (!preview.url) {
      continue
    }

    if (preview.status != "ready") {
      continue
    }

    const response = await fetch(preview.url)
    const blob = await response.blob()
    const objectURL = URL.createObjectURL(blob)
    const item = {
      page_id: imageWithURLs.page_id,
      size: preview.size,
      objectURL
    }

    results.push(item)
  }

  return results
})

const imageObjectsSlice = createSlice({
  name: "imageObjects",
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
    builder.addCase(preloadProgressiveImages.fulfilled, (state, action) => {
      for (const {page_id, size, objectURL} of action.payload) {
        const existing = state[page_id] ?? {}
        const oldUrl = existing[size]
        if (oldUrl) URL.revokeObjectURL(oldUrl)

        state[page_id] = {
          ...existing,
          [size]: objectURL
        }
      }
    })
  }
})

export const {clearImages} = imageObjectsSlice.actions
export default imageObjectsSlice.reducer
