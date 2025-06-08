import {RootState} from "@/app/types"
import {UUID} from "@/types.d/common"
import type {
  PageImageSize,
  ProgressiveImageInputType
} from "@/types.d/page_image"
import {getBaseURL, getDefaultHeaders} from "@/utils"
import {createAsyncThunk, createSlice} from "@reduxjs/toolkit"

export interface ImageState {
  [page_id: string]: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    docVerID: UUID
    docID: UUID
  }
}

const initialState: ImageState = {}

interface PayloadType {
  page_id: UUID
  docID: UUID
  docVerID: UUID
  objectURL: string
  size: PageImageSize
}

export const preloadProgressiveImages = createAsyncThunk<
  PayloadType[], // 1. Return type of payload (fulfilled result)
  ProgressiveImageInputType // 2. Argument passed into the thunk
>("images/preloadProgressiveImages", async imageWithURLs => {
  const results: PayloadType[] = []
  const headers = getDefaultHeaders()
  let url

  for (const preview of imageWithURLs.previews) {
    if (!preview.url) {
      continue
    }

    if (preview.status != "ready") {
      continue
    }

    if (preview.url && !preview.url.startsWith("/api/")) {
      // cloud URL e.g. aws cloudfront URL
      url = preview.url
    } else {
      // use backend server URL (which may differ from frontend's URL)
      url = `${getBaseURL(true)}${preview.url}`
    }

    const response = await fetch(url, {headers: headers})
    const blob = await response.blob()
    const objectURL = URL.createObjectURL(blob)
    const item = {
      page_id: imageWithURLs.page_id as UUID,
      docID: imageWithURLs.docID,
      docVerID: imageWithURLs.docVerID,
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
      for (const {
        page_id,
        size,
        objectURL,
        docID,
        docVerID
      } of action.payload) {
        const existing = state[page_id] ?? {}
        const oldUrl = existing[size]
        if (oldUrl) URL.revokeObjectURL(oldUrl)

        state[page_id] = {
          ...existing,
          [size]: objectURL,
          docID: docID,
          docVerID: docVerID
        }
      }
    })
  }
})

export const {clearImages} = imageObjectsSlice.actions
export default imageObjectsSlice.reducer

export const selectPageListIDs = (state: RootState, docVerID?: UUID) => {
  if (!docVerID) {
    return []
  }

  const pageIDs = Object.entries(state.imageObjects)
    .filter(([_, value]) => value.docVerID === docVerID)
    .map(([page_id, _]) => page_id)
  return pageIDs
}
