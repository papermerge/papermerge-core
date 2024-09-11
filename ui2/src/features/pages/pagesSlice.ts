import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/apiSlice"
import type {DocumentType, PageType} from "@/types"
import {PayloadAction, createEntityAdapter, createSlice} from "@reduxjs/toolkit"

const pageAdapter = createEntityAdapter<PageType>()
const initialState = pageAdapter.getInitialState()

/**
 * This slice is used for convenient access to page url (page.jpg_url, page.svg_url)
 * in `getPageImage` endpoint
 */
const pagesSlice = createSlice({
  name: "pages",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithDocuments.endpoints.getDocument.matchFulfilled,
      (state, action: PayloadAction<DocumentType>) => {
        let all_pages: Array<PageType> = []

        action.payload.versions.forEach(v => {
          v.pages.forEach(p => {
            all_pages.push(p)
          })
        })

        pageAdapter.addMany(state, all_pages)
      }
    )
  }
})

export default pagesSlice.reducer

export const {selectEntities: selectNodeEntities} = pageAdapter.getSelectors(
  (state: RootState) => state.pages
)
