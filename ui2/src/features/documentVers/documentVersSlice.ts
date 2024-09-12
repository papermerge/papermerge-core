import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "@/features/document/apiSlice"
import type {
  ClientDocumentVersion,
  ClientPage,
  DocumentType,
  DroppedThumbnailPosition
} from "@/types"
import {PanelMode} from "@/types"
import {contains_every, reorder} from "@/utils"
import {
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit"

type PageDroppedArgs = {
  sources: ClientPage[]
  target: ClientPage
  targetDocVerID: string
  position: DroppedThumbnailPosition
}

type PageRotatedArgs = {
  sources: ClientPage[]
  angle: number
  targetDocVerID: string
}

const docVerAdapter = createEntityAdapter<ClientDocumentVersion>()
const initialState = docVerAdapter.getInitialState()

/**
 * This slice is used for storing page metadata i.e. page
 * position and rotation
 */
const docVersSlice = createSlice({
  name: "documentVersion",
  initialState,
  reducers: {
    pagesDroppedInDoc(state, action: PayloadAction<PageDroppedArgs>) {
      const {targetDocVerID, sources, target, position} = action.payload
      const docVer = state.entities[targetDocVerID]
      const pages = docVer.pages
      const page_ids = pages.map(p => p.id)
      const source_ids = sources.map(p => p.id)
      if (contains_every({container: page_ids, items: source_ids})) {
        const newPages = reorder<ClientPage, string>({
          arr: pages,
          source_ids: source_ids,
          target_id: target.id,
          position: position,
          idf: (val: ClientPage) => val.id
        })
        state.entities[targetDocVerID].pages = newPages
      }
    },
    pagesRotated(state, action: PayloadAction<PageRotatedArgs>) {
      const {targetDocVerID, sources, angle} = action.payload
      const docVer = state.entities[targetDocVerID]
      const pages = docVer.pages
      const newPages = pages.map(p => {
        for (let i = 0; i < sources.length; i++) {
          if (sources[i].id == p.id) {
            return {id: p.id, angle: p.angle + angle, number: p.number}
          }
        }
        return p
      })
      state.entities[targetDocVerID].pages = newPages
    }
  },
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
            }),
            initial_pages: v.pages.map(p => {
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

export const {pagesDroppedInDoc, pagesRotated} = docVersSlice.actions
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
