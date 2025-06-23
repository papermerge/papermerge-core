import { RootState } from "@/app/types"
import { fileManager } from "@/features/files/fileManager"
import { ImageSize, UUID } from "@/types.d/common"
import { generatePreview as util_pdf_generatePreview } from "@/utils/pdf"
import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit"
import type {
  GeneratePreviewInputType
} from "./types"

export type ImageState = {
  [pageID: string]: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    docVerID: UUID
    docID: UUID
    pageNumber?: number
  }
}

const initialState: ImageState = {}

type ReturnTypeItem = {
  pageID: UUID
  pageNumber: number
  docID: UUID
  docVerID: UUID
  objectURL?: string
  size: ImageSize
}

type ReturnType = {
  error?: string
  items: ReturnTypeItem[]
}

export const generatePreviews = createAsyncThunk<
  ReturnType,
  GeneratePreviewInputType
>("images/generatePreview", async item => {
  const width = getWidth(item.size)
  const smallWidth = getWidth(item.size)
  const result: ReturnType = {
    items: []
  }
  const fileItem = fileManager.getByDocVerID(item.docVer.id)

  if (!fileItem) {
    return {
      items: [],
      error: "There was an error generating thumbnail image"
    }
  }

  const file = new File([fileItem.buffer], "filename.pdf", {
    type: "application/pdf"
  });

  for (let pNum = item.firstPage; pNum <= item.lastPage; pNum++) {
    const objectURL = await util_pdf_generatePreview(
      { file: file, width, pageNumber: pNum }
    )

    const page = item.docVer.pages.find(p => p.number == pNum)
    if (!page) {
      return {
        items: [],
        error: `page number ${pNum} not found in pages`
      }
    }

    if (objectURL) {
      result.items.push({
        pageID: page.id,
        docID: item.docVer.document_id,
        docVerID: item.docVer.id,
        pageNumber: pNum,
        objectURL: objectURL,
        size: item.size,
      })
    }
  }

  if (item.size != "sm") {
    for (let pNum = item.firstPage; pNum <= item.lastPage; pNum++) {
      const objectURL = await util_pdf_generatePreview(
        { file: file, width: smallWidth, pageNumber: pNum }
      )

      const page = item.docVer.pages.find(p => p.number == pNum)
      if (!page) {
        return {
          items: [],
          error: `page number ${pNum} not found in pages`
        }
      }

      if (objectURL) {
        result.items.push({
          pageID: page.id,
          docID: item.docVer.document_id,
          docVerID: item.docVer.id,
          pageNumber: pNum,
          objectURL: objectURL,
          size: "sm",
        })
      }
    }
  }

  return result
})


const imageObjectsSlice = createSlice({
  name: "imageObjects",
  initialState,
  reducers: {
    /*
    clearImages(state) {
      for (const sizes of Object.values(state)) {
        for (const url of Object.values(sizes)) {
          if (url) URL.revokeObjectURL(url)
        }
      }
      return {}
    }
      */
  },
  extraReducers: builder => {
    builder.addCase(generatePreviews.fulfilled, (state, action) => {
      for (const {
        pageID,
        size,
        objectURL,
        docID,
        docVerID,
        pageNumber
      } of action.payload.items) {
        const existing = state[pageID] ?? {}
        const oldUrl = existing[size]
        if (oldUrl) URL.revokeObjectURL(oldUrl)

        state[pageID] = {
          ...existing,
          [size]: objectURL,
          docID: docID,
          docVerID: docVerID
        }
        if (pageNumber !== undefined && pageNumber != null) {
          state[pageID]["pageNumber"] = pageNumber
        }
      }
    })
  }
})

export default imageObjectsSlice.reducer
export const selectImageObjects = (state: RootState) => state.imageObjects


export const selectExistingPreviewsPageNumbers = createSelector(
  [
    selectImageObjects,
    (_: RootState, docVerID?: UUID) => docVerID // Pass docVerID as input
  ],
  (imageObjects, docVerID) => {
    if (!docVerID) return []

    const pageNumbers = Object.entries(imageObjects)
      .filter(([_, value]) => value.docVerID === docVerID && value.md && value.sm)
      .map(([_, value]) => value.pageNumber)

    return pageNumbers
  }
)
export const selectShowMorePages = (
  state: RootState,
  docVerID?: UUID,
  totalCount?: number
): boolean => {
  /* Are document pages to load? */
  const localTotalCount = Object.entries(state.imageObjects).filter(
    ([_, value]) => value.docVerID === docVerID
  ).length

  if (!totalCount) {
    return true
  }

  return localTotalCount < totalCount
}


function getWidth(size: ImageSize) {
  if (size == "sm") {
    return 200
  }

  if (size == "md") {
    return 800
  }

  if (size == "lg") {
    return 1200
  }

  return 1600
}
