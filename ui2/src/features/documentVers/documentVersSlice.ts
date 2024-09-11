import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/apiSlice"
import type {ClientDocumentVersion, DocumentType} from "@/types"
import {PanelMode} from "@/types"
import {
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit"

const docVerAdapter = createEntityAdapter<ClientDocumentVersion>()
const initialState = docVerAdapter.getInitialState()

/**
 * This slice is used for storing page metadata i.e. page
 * position and rotation
 */
const docVersSlice = createSlice({
  name: "documentVersion",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithDocuments.endpoints.getDocument.matchFulfilled,
      (state, action: PayloadAction<DocumentType>) => {
        let all_vers: Array<ClientDocumentVersion> = []

        action.payload.versions.forEach(v => {
          let ver: ClientDocumentVersion = {
            id: v.id,
            lang: v.lang,
            number: v.number,
            page_count: v.page_count,
            short_description: v.short_description,
            size: v.size,
            pages: v.pages.map(p => {
              return {id: p.id, number: p.number, angle: 0}
            })
          }
          all_vers.push(ver)
        })

        docVerAdapter.addMany(state, all_vers)
      }
    )
  }
})

export default docVersSlice.reducer

export const {
  selectEntities: selectDocVerEntities,
  selectById: selectDocVerByID
} = docVerAdapter.getSelectors((state: RootState) => state.docVers)

export const selectCurrentPages = createSelector([selectDocVerByID], docVer => {
  if (docVer) {
    return docVer.pages
  }

  return []
})

export const selectAllPages = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    const docVerID = state.ui.mainViewerCurrentDocVerID
    if (docVerID) {
      const docVer = state.docVers.entities[docVerID]
      if (docVer) {
        return docVer.pages
      }
    }
  }

  if (mode == "secondary") {
    const docVerID = state.ui.secondaryViewerCurrentDocVerID
    if (docVerID) {
      const docVer = state.docVers.entities[docVerID]
      if (docVer) {
        return docVer.pages
      }
    }
  }

  return []
}

export const selectSelectedPageIDs = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewerSelectedIDs
  }

  if (mode == "secondary") {
    return state.ui.secondaryViewerSelectedIDs
  }
}

export const selectSelectedPages = createSelector(
  [selectAllPages, selectSelectedPageIDs],
  (pages, pageIDs) => {
    return pages.filter(p => pageIDs?.includes(p.id))
  }
)
