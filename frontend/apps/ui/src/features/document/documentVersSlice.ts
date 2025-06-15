import {RootState} from "@/app/types"
import {apiSliceWithSharedNodes} from "@/features/shared_nodes/apiSlice"
import type {
  ClientDocumentVersion,
  ClientPage,
  DocumentType,
  DroppedThumbnailPosition,
  ServerNotifDocumentMoved
} from "@/types"
import {PanelMode} from "@/types"
import {UUID} from "@/types.d/common"
import {contains_every, reorder} from "@/utils"
import {notifications} from "@mantine/notifications"
import {
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit"
import {DOC_VER_PAGINATION_PAGE_SIZE} from "./constants"

interface PaginationUpdated {
  pageNumber: number
  pageSize: number
  docVerID: UUID
}

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

type PageDeletedArgs = {
  sources: ClientPage[]
  targetDocVerID: string
}

export const docVerAdapter = createEntityAdapter<ClientDocumentVersion>()
const initialState = docVerAdapter.getInitialState()

/**
 * This slice is used for storing page metadata i.e. page
 * position and rotation
 */
const docVersSlice = createSlice({
  name: "documentVersion",
  initialState,
  reducers: {
    docVerPaginationUpdated(state, action: PayloadAction<PaginationUpdated>) {
      const {pageNumber, pageSize, docVerID} = action.payload
      const docVer = state.entities[docVerID]
      if (docVer) {
        if (docVer.pagination) {
          docVer.pagination.page_number = pageNumber
          docVer.pagination.per_page = pageSize
        } else {
          docVer.pagination = {
            page_number: pageNumber,
            per_page: pageSize
          }
        }
      }
    },
    docVerUpserted(state, action: PayloadAction<ClientDocumentVersion>) {
      docVerAdapter.upsertOne(state, action.payload)
    },
    pagesDroppedInDoc(state, action: PayloadAction<PageDroppedArgs>) {
      const {targetDocVerID, sources, target, position} = action.payload
      const docVer = state.entities[targetDocVerID]
      const pages = docVer.pages
      const page_ids = pages.map(p => p.id)
      const source_ids = sources.map(p => p.id)
      if (contains_every({container: page_ids, items: source_ids})) {
        /* Here we deal with page transfer is within the same document
        i.e we are just reordering. It is so because all source pages (their IDs)
        were found in the target document version.
        */
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
            return {
              id: p.id,
              angle: p.angle + angle,
              number: p.number
            }
          }
        }
        return p
      })
      state.entities[targetDocVerID].pages = newPages
    },
    pagesReseted(state, action: PayloadAction<string>) {
      const docVerID = action.payload
      const docVer = state.entities[docVerID]
      state.entities[docVerID].pages = docVer.initial_pages
    },
    pagesDeleted(state, action: PayloadAction<PageDeletedArgs>) {
      const {sources, targetDocVerID} = action.payload
      const docVer = state.entities[targetDocVerID]
      const pages = docVer.pages
      const pageIDsToBeDeleted = sources.map(i => i.id)
      const newPages = pages.filter(p => {
        for (let i = 0; i < sources.length; i++) {
          if (!pageIDsToBeDeleted.includes(p.id)) {
            return p
          }
        }
      })
      state.entities[targetDocVerID].pages = newPages
    },
    documentMovedNotifReceived(
      _state,
      action: PayloadAction<ServerNotifDocumentMoved>
    ) {
      notifications.show({
        withBorder: true,
        message: `Document title updated to ${action.payload.new_document_title}`
      })
    }
  },
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithSharedNodes.endpoints.getSharedDocument.matchFulfilled,
      (state, action: PayloadAction<DocumentType>) => {
        let all_vers: Array<ClientDocumentVersion> = []

        action.payload.versions.forEach(v => {
          let ver: ClientDocumentVersion = {
            id: v.id,
            lang: v.lang,
            number: v.number,
            file_name: v.file_name,
            pages: v.pages.map(p => {
              return {id: p.id, number: p.number, angle: 0, text: p.text}
            }),
            initial_pages: v.pages.map(p => {
              return {id: p.id, number: p.number, angle: 0, text: p.text}
            }),
            pagination: {
              page_number: 1,
              per_page: DOC_VER_PAGINATION_PAGE_SIZE
            }
          }
          all_vers.push(ver)
        })

        docVerAdapter.addMany(state, all_vers)
      }
    )
  }
})

export const {
  pagesDroppedInDoc,
  pagesRotated,
  pagesReseted,
  pagesDeleted,
  documentMovedNotifReceived,
  docVerPaginationUpdated,
  docVerUpserted
} = docVersSlice.actions
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
      } else {
        //console.log(`doc ver undefined`)
      }
    } else {
      //console.log(`docVerID not undefined`)
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
}

export const selectDocumentVersionOCRLang = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    const docVerID = state.ui.mainViewerCurrentDocVerID
    if (docVerID) {
      const docVer = state.docVers.entities[docVerID]
      if (docVer) {
        return docVer.lang
      }
    }
  }

  if (mode == "secondary") {
    const docVerID = state.ui.secondaryViewerCurrentDocVerID
    if (docVerID) {
      const docVer = state.docVers.entities[docVerID]
      if (docVer) {
        return docVer.lang
      }
    }
  }
}

export const selectDocumentVersionID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewerCurrentDocVerID
  }

  if (mode == "secondary") {
    return state.ui.secondaryViewerCurrentDocVerID
  }
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
    if (pages) {
      return pages.filter(p => pageIDs?.includes(p.id))
    }
  }
)

export const selectInitialPages = (
  state: RootState,
  mode: PanelMode
): Array<ClientPage> | undefined => {
  if (mode == "main") {
    const curDocVerID = state.ui.mainViewerCurrentDocVerID
    if (curDocVerID) {
      if (state.docVers.entities[curDocVerID]) {
        return state.docVers.entities[curDocVerID].initial_pages
      }
    }
  }
  if (mode == "secondary") {
    const curDocVerID = state.ui.secondaryViewerCurrentDocVerID
    if (curDocVerID) {
      if (state.docVers.entities[curDocVerID]) {
        return state.docVers.entities[curDocVerID].initial_pages
      }
    }
  }
}

export const selectPagesHaveChanged = createSelector(
  [selectInitialPages, selectAllPages],
  (
    initialPages: Array<ClientPage> | undefined,
    currentPages: Array<ClientPage> | undefined
  ): boolean => {
    if (!initialPages) {
      return false
    }

    if (!currentPages) {
      return false
    }

    if (initialPages?.length != currentPages?.length) {
      return true
    }

    for (let i = 0; i < (initialPages?.length || 0); i++) {
      if (initialPages[i].id != currentPages[i].id) {
        return true
      }

      if (initialPages[i].number != currentPages[i].number) {
        return true
      }

      if (initialPages[i].angle != currentPages[i].angle) {
        return true
      }
    }

    return false
  }
)

export const selectDocVerPaginationPageNumber = (
  state: RootState,
  docVerID?: UUID
) => {
  if (!docVerID) {
    return 1
  }

  const docVer = state.docVers.entities[docVerID]

  if (!docVer) {
    return 1
  }

  const pagination = state.docVers.entities[docVerID].pagination

  if (!pagination) {
    return 1
  }

  return state.docVers.entities[docVerID].pagination.page_number
}

export const selectDocVerClientPage = (
  state: RootState,
  {docVerID, pageID}: {docVerID?: string; pageID?: string}
) => {
  if (!docVerID) {
    return null
  }

  if (!pageID) {
    return null
  }

  const docVer = state.docVers.entities[docVerID]

  if (!docVer) {
    return null
  }

  return state.docVers.entities[docVerID].pages.find(p => p.id == pageID)
}
