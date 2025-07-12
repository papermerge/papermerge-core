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
import type {BasicPage, GeneratePreviewInputType} from "../types"
import {getDocLastVersion, rotateImageObjectURL} from "../utils"

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

interface Updates {
  updates: {
    newPageID: string
    newPageNumber: number
    oldPageID: string
    docVerID: string
    docID: string
  }[]
}

export const generatePreviews = createAsyncThunk<
  ReturnType,
  GeneratePreviewInputType
>("images/generatePreview", async item => {
  const width = getWidth(item.size)

  const result: ReturnType = {
    items: []
  }
  let fileItem = fileManager.getByDocVerID(item.docVer.id)

  if (!fileItem) {
    // file not found in local storage. Download it first
    const {
      ok,
      data,
      error: downloadError
    } = await getDocLastVersion(item.docVer.document_id)

    if (ok && data) {
      const arrayBuffer = await data.blob.arrayBuffer()
      fileItem = {
        buffer: arrayBuffer,
        docVerID: data.docVerID
      }
      fileManager.store(fileItem)
    } else {
      console.error(downloadError || "Unknown download error")
      return {
        items: [],
        error: "There was an error generating thumbnail image"
      }
    }
  }

  const file = new File([fileItem.buffer], "filename.pdf", {
    type: "application/pdf"
  })

  const firstPage = (item.pageNumber - 1) * item.pageSize
  const lastPage = Math.min(firstPage + item.pageSize, item.pageTotal)
  const sortedPages = item.docVer.pages
    .slice()
    .sort((a, b) => a.number - b.number)

  const sortedPagesTotal = sortedPages.length

  for (let pIndex = firstPage; pIndex < lastPage; pIndex++) {
    if (pIndex >= sortedPagesTotal) {
      console.error(`Page index ${pIndex} out of bound: ${sortedPagesTotal}`)
      return {
        items: [],
        error: `Page index ${pIndex} out of bound: ${sortedPagesTotal}`
      }
    }
    const page = sortedPages[pIndex]
    const objectURL = await util_pdf_generatePreview({
      file: file,
      width,
      pageNumber: page.number
    })

    if (objectURL) {
      result.items.push({
        pageID: page.id,
        docID: item.docVer.document_id,
        docVerID: item.docVer.id,
        pageNumber: page.number,
        objectURL: objectURL,
        size: item.size
      })
    }
  }

  return result
})

export const rotateAndAddImageObjects = createAsyncThunk(
  "imageObjects/rotateAndAddImageObjects",
  async (
    {
      updates
    }: {
      updates: {
        newPageID: string
        newPageNumber: number
        oldPageID: string
        angle: number
        docVerID: string
        docID: string
      }[]
    },
    {getState}
  ) => {
    const state: RootState = getState() as RootState
    const results: {
      newPageID: string
      newPageNumber: number
      docVerID: string
      docID: string
      rotated: {
        sm?: string
        md?: string
        lg?: string
        xl?: string
      }
    }[] = []

    for (const {
      newPageID,
      newPageNumber,
      oldPageID,
      angle,
      docVerID,
      docID
    } of updates) {
      const oldImage = state.imageObjects.pageIDEntities[oldPageID]
      if (!oldImage) continue

      const rotated: any = {}

      const sizes = ["sm", "md", "lg", "xl"] as const
      for (const size of sizes) {
        const url = oldImage[size]
        if (url && angle !== 0) {
          const blob = await rotateImageObjectURL(url, angle)
          rotated[size] = URL.createObjectURL(blob)
        } else {
          rotated[size] = url
        }
      }

      results.push({
        newPageID,
        newPageNumber,
        docVerID,
        docID,
        rotated
      })
    }

    return results
  }
)

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
    addImageObjects(state, action: PayloadAction<Updates>) {
      const updates = action.payload.updates
      for (const {
        newPageID,
        newPageNumber,
        oldPageID,
        docVerID,
        docID
      } of updates) {
        const oldImage = state.pageIDEntities[oldPageID]
        if (!oldImage) continue

        const rotated: any = {}

        const sizes = ["sm", "md", "lg", "xl"] as const
        for (const size of sizes) {
          const url = oldImage[size]
          rotated[size] = url
        }
        state.pageIDEntities[newPageID] = {
          pageNumber: newPageNumber,
          docVerID,
          docID,
          ...rotated
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

    builder.addCase(rotateAndAddImageObjects.fulfilled, (state, action) => {
      for (const {
        newPageID,
        newPageNumber,
        docVerID,
        docID,
        rotated
      } of action.payload) {
        state.pageIDEntities[newPageID] = {
          pageNumber: newPageNumber,
          docVerID,
          docID,
          ...rotated
        }
      }
    })
  }
})

export default imageObjectsSlice.reducer

export const {
  markGeneratingPreviewsBegin,
  markGeneratingPreviewsEnd,
  addImageObjects
} = imageObjectsSlice.actions

export const selectImageObjects = (state: RootState) => state.imageObjects

export const selectAreAllPreviewsAvailable = (
  state: RootState,
  pagesToCheck: BasicPage[],
  imageSize: ImageSize,
  docVerID?: string
): boolean => {
  const imageObjState = state.imageObjects
  return pagesToCheck.every(({id, number}) => {
    const entry = imageObjState.pageIDEntities[id]
    return (
      entry !== undefined &&
      entry.pageNumber === number &&
      entry.docVerID === docVerID &&
      entry[imageSize]
    )
  })
}

export const selectPagesWithPreviews = createSelector(
  [
    selectImageObjects,
    (_: RootState, __: ImageSize, docVerID?: UUID) => docVerID, // Pass docVerID as input
    (_: RootState, size: ImageSize, __?: UUID) => size
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

const selectDocVerByID = (
  state: RootState,
  __: ImageSize,
  docVerID?: string
) => {
  if (docVerID) {
    return state.docVers.entities[docVerID]
  }

  return null
}

export const selectClientPagesWithPreviews = createSelector(
  [selectPagesWithPreviews, selectDocVerByID],
  (basicPages, docVer) => {
    if (!docVer) {
      console.log(`selectClientPagesWithPreviews: docVer not found`)
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
  size: ImageSize,
  docVerID?: UUID
) => {
  if (!docVerID) {
    return false
  }

  if (size == "sm") {
    return Boolean(
      state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingSM
    )
  }
  if (size == "md") {
    return Boolean(
      state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingMD
    )
  }
  if (size == "lg") {
    return Boolean(
      state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingLG
    )
  }

  return Boolean(state.imageObjects.docVerIDEntities[docVerID]?.isGeneratingXL)
}

function getWidth(size: ImageSize) {
  if (size == "sm") {
    return 200
  }

  if (size == "md") {
    return 1300
  }

  if (size == "lg") {
    return 1600
  }

  return 1900
}
