import {RootState} from "@/app/types"
import type {DocumentType} from "@/features/document/types"
import {apiSliceWithSharedNodes} from "@/features/shared_nodes/apiSlice"
import type {PageType} from "@/types"
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
      apiSliceWithSharedNodes.endpoints.getSharedDocument.matchFulfilled,
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
