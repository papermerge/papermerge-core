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
import {getDocLastVersion, rotateImageObjectURL} from "./utils"

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
        number: number
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
      number: number
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
      docID,
      number
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
        number,
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

export const {markGeneratingPreviewsBegin, markGeneratingPreviewsEnd} =
  imageObjectsSlice.actions

export const selectImageObjects = (state: RootState) => state.imageObjects

/*
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
*/
export const selectAreAllPreviewsAvailable = (
  state: RootState,
  pagesToCheck: BasicPage[],
  docVerID: string,
  imageSize: ImageSize
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
