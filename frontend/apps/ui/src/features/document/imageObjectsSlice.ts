import {RootState} from "@/app/types"
import {fileManager} from "@/features/files/fileManager"
import {ImageSize, UUID} from "@/types.d/common"
import {generatePreview as util_pdf_generatePreview} from "@/utils/pdf"
import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction
} from "@reduxjs/toolkit"
import type {BasicPage, GeneratePreviewInputType} from "./types"

export type PageIDEntitiesState = {
  [pageID: string]: {
    sm?: string
    md?: string
    lg?: string
    xl?: string
    docVerID: UUID
    docID: UUID
    pageNumber: number
  }
}

type DocVerIDEntities = {
  [docVerID: string]: {
    isGenerating: boolean
  }
}

type ImageObjectsState = {
  pageIDEntities: PageIDEntitiesState
  docVerIDEntities: DocVerIDEntities
}

const initialState: ImageObjectsState = {
  pageIDEntities: {},
  docVerIDEntities: {}
}

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
  //const smallWidth = getWidth(item.size)
  const result: ReturnType = {
    items: []
  }
  const fileItem = fileManager.getByDocVerID(item.docVer.id)

  if (!fileItem) {
    console.error(`FileManager: no file found for ${item.docVer.id}`)
    return {
      items: [],
      error: "There was an error generating thumbnail image"
    }
  }

  const file = new File([fileItem.buffer], "filename.pdf", {
    type: "application/pdf"
  })

  const firstPage = (item.pageNumber - 1) * item.pageSize + 1
  const lastPage = Math.min(firstPage + item.pageSize, item.pageTotal)

  for (let pNum = firstPage; pNum <= lastPage; pNum++) {
    const objectURL = await util_pdf_generatePreview({
      file: file,
      width,
      pageNumber: pNum
    })

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
        size: item.size
      })
    }
  }

  return result
})

const imageObjectsSlice = createSlice({
  name: "imageObjects",
  initialState,
  reducers: {
    markGeneratingPreviewsBegin(state, action: PayloadAction<UUID>) {
      const docVerID = action.payload
      const entity = state.docVerIDEntities[docVerID]
      if (entity) {
        entity.isGenerating = true
      } else {
        state.docVerIDEntities[docVerID] = {
          isGenerating: true
        }
      }
    },
    markGeneratingPreviewsEnd(state, action: PayloadAction<UUID>) {
      const docVerID = action.payload
      const entity = state.docVerIDEntities[docVerID]
      if (entity) {
        entity.isGenerating = false
      } else {
        state.docVerIDEntities[docVerID] = {
          isGenerating: false
        }
      }
    }
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
        const existing = state.pageIDEntities[pageID] ?? {}
        const oldUrl = existing[size]
        if (oldUrl) URL.revokeObjectURL(oldUrl)

        state.pageIDEntities[pageID] = {
          ...existing,
          [size]: objectURL,
          docID: docID,
          docVerID: docVerID,
          pageNumber: pageNumber
        }
      }
    })
  }
})

export default imageObjectsSlice.reducer

export const {markGeneratingPreviewsBegin, markGeneratingPreviewsEnd} =
  imageObjectsSlice.actions

export const selectImageObjects = (state: RootState) => state.imageObjects

export const selectAreAllPreviewsAvailable = (
  pagesToCheck: BasicPage[],
  docVerID: string
) =>
  createSelector(
    (state: RootState) => state.imageObjects,
    (imageObjState: ImageObjectsState) => {
      return pagesToCheck.every(({id, number}) => {
        const entry = imageObjState.pageIDEntities[id]
        return (
          entry !== undefined &&
          entry.pageNumber === number &&
          entry.docVerID === docVerID &&
          entry.md
        )
      })
    }
  )

export const selectPagesWithPreviews = createSelector(
  [
    selectImageObjects,
    (_: RootState, docVerID: UUID) => docVerID // Pass docVerID as input
  ],
  (imageObjects, docVerID) => {
    if (!docVerID) return []

    const pages: Array<BasicPage> = Object.entries(imageObjects.pageIDEntities)
      .filter(([_, value]) => value.docVerID === docVerID && value.md)
      .map(([pageID, value]) => {
        return {id: pageID, number: value.pageNumber}
      })

    return pages
  }
)

const selectDocVerByID = (state: RootState, docVerID?: string) => {
  if (docVerID) {
    return state.docVers.entities[docVerID]
  }

  return null
}

export const selectClientPagesWithPreviews = createSelector(
  [selectPagesWithPreviews, selectDocVerByID],
  (basicPages, docVer) => {
    if (!docVer) {
      return []
    }

    const IDSWithPreviews = basicPages.map(bp => bp.id)

    return docVer.pages.filter(p => IDSWithPreviews.includes(p.id))
  }
)

export const selectShowMorePages = (
  state: RootState,
  docVerID?: UUID,
  totalCount?: number
): boolean => {
  /* Are document pages to load? */
  const localTotalCount = Object.entries(
    state.imageObjects.pageIDEntities
  ).filter(([_, value]) => value.docVerID === docVerID).length

  if (!totalCount) {
    return true
  }

  return localTotalCount < totalCount
}

export const selectIsGeneratingPreviews = (
  state: RootState,
  docVerID: UUID
) => {
  return state.imageObjects.docVerIDEntities[docVerID]?.isGenerating
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
