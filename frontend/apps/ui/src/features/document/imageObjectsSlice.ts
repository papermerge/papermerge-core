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
    isGeneratingSM: boolean
    isGeneratingMD: boolean
    isGeneratingLG: boolean
    isGeneratingXL: boolean
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

interface MarkGenPayLoad {
  docVerID: UUID
  size: ImageSize
}

const imageObjectsSlice = createSlice({
  name: "imageObjects",
  initialState,
  reducers: {
    markGeneratingPreviewsBegin(state, action: PayloadAction<MarkGenPayLoad>) {
      const docVerID = action.payload.docVerID
      const size = action.payload.size

      const entity = state.docVerIDEntities[docVerID]
      if (entity) {
        switch (size) {
          case "sm":
            entity.isGeneratingSM = true
            break
          case "md":
            entity.isGeneratingMD = true
            break
          case "lg":
            entity.isGeneratingLG = true
            break
          case "xl":
            entity.isGeneratingXL = true
            break
        }
      } else {
        state.docVerIDEntities[docVerID] = {
          isGeneratingSM: size == "sm",
          isGeneratingMD: size == "md",
          isGeneratingLG: size == "lg",
          isGeneratingXL: size == "xl"
        }
      }
    },
    markGeneratingPreviewsEnd(state, action: PayloadAction<MarkGenPayLoad>) {
      const docVerID = action.payload.docVerID
      const size = action.payload.size

      const entity = state.docVerIDEntities[docVerID]
      if (entity) {
        switch (size) {
          case "sm":
            entity.isGeneratingSM = false
            break
          case "md":
            entity.isGeneratingMD = false
            break
          case "lg":
            entity.isGeneratingLG = false
            break
          case "xl":
            entity.isGeneratingXL = false
            break
        }
      } else {
        state.docVerIDEntities[docVerID] = {
          isGeneratingSM: false,
          isGeneratingMD: false,
          isGeneratingLG: false,
          isGeneratingXL: false
        }
      }
    },
    addImageObjectsFromPrevious: (
      state,
      action: PayloadAction<{
        updates: {
          newPageID: string
          oldPageID: string
          angle: number
          docVerID: string
          docID: string
        }[]
      }>
    ) => {
      action.payload.updates.forEach(
        ({newPageID, oldPageID, angle, docVerID, docID}) => {
          const oldImage = state.pageIDEntities[oldPageID]
          if (!oldImage) return
          if (angle === 0) {
            state.pageIDEntities[newPageID] = {
              pageNumber: oldImage.pageNumber,
              docVerID,
              docID,
              sm: oldImage.sm,
              md: oldImage.md,
              lg: oldImage.lg,
              xl: oldImage.xl
            }
          } else {
            // You can add rotation logic here if needed
          }
        }
      )
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

export const {
  markGeneratingPreviewsBegin,
  markGeneratingPreviewsEnd,
  addImageObjectsFromPrevious
} = imageObjectsSlice.actions

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
    (_: RootState, docVerID: UUID, __: ImageSize = "md") => docVerID, // Pass docVerID as input
    (_: RootState, __: UUID, size: ImageSize = "md") => size
  ],
  (imageObjects, docVerID, size = "md") => {
    if (!docVerID) return []

    const pages: Array<BasicPage> = Object.entries(imageObjects.pageIDEntities)
      .filter(([_, value]) => value.docVerID === docVerID && value[size])
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
  docVerID: UUID,
  size: ImageSize
) => {
  if (size == "sm") {
    return state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingSM
  }
  if (size == "md") {
    return state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingMD
  }
  if (size == "lg") {
    return state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingLG
  }

  return state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingXL
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
