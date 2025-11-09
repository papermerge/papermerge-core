import {RootState} from "@/app/types"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {skipToken} from "@reduxjs/toolkit/query"
import {apiSliceWithDocumentsByCategory} from "./api"

export type DocumentsByCategorySlice = {
  categoryID?: string | null
}

export const initialState: DocumentsByCategorySlice = {}

const documentsByCategorySlice = createSlice({
  name: "documentsByCategory",
  initialState,
  reducers: {
    documentCategoryIDUpdated(state, action: PayloadAction<string | null>) {
      const categoryID = action.payload
      state.categoryID = categoryID
    }
  }
})

export const {documentCategoryIDUpdated} = documentsByCategorySlice.actions

export default documentsByCategorySlice.reducer

export const selectDocumentsByCategorysResult =
  apiSliceWithDocumentsByCategory.endpoints.getPaginatedDocumentsByCategory.select(
    skipToken
  )
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId
export const selectDocumentCategoryID = (state: RootState) =>
  state.documentsByCategory.categoryID
