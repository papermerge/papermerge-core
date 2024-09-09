import Cookies from "js-cookie"
import {
  createSlice,
  PayloadAction,
  createAsyncThunk,
  createSelector
} from "@reduxjs/toolkit"
import {getBaseURL, getDefaultHeaders} from "@/utils"

import axios from "axios"

axios.defaults.baseURL = getBaseURL()
axios.defaults.headers.common = getDefaultHeaders()

import {RootState} from "@/app/types"
import {
  selectionAddPageHelper,
  selectionRemovePageHelper,
  dropThumbnailPageHelper,
  resetPageChangesHelper,
  getLatestVersionPages
} from "./helpers"

import type {
  SliceState,
  NodeType,
  PageType,
  PanelMode,
  PanelType,
  DocumentType,
  CurrentNodeType,
  SearchResultNode,
  PaginatedSearchResult,
  DroppedThumbnailPosition,
  BooleanString,
  PageAndRotOp,
  DocumentVersion,
  DocumentVersionWithPageRot,
  ApplyPagesType
} from "@/types"
import {DualPanelState, SelectionPagePayload} from "./types"
import {MIN_ZOOM_FACTOR, MAX_ZOOM_FACTOR, ZOOM_FACTOR_STEP} from "@/cconstants"

const MAIN_THUMBNAILS_PANEL_OPENED_COOKIE = "main_thumbnails_panel_opened"
const SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE =
  "secondary_thumbnails_panel_opened"

const initialState: DualPanelState = {
  mainPanel: {
    viewer: null,
    searchResults: null
  },
  secondaryPanel: null
}

type ApplyPageOpChangesThunkArgs = {
  panel: PanelMode
  pages: ApplyPagesType[]
}

export const applyPageOpChanges = createAsyncThunk<
  DocumentType,
  ApplyPageOpChangesThunkArgs
>(
  "document/applyPageOpChanges",
  async ({pages}: ApplyPageOpChangesThunkArgs) => {
    const response = await axios.post("/api/pages/", pages)
    const doc = response.data as DocumentType
    return doc
  }
)

type fetchPaginatedSearchResultsArgs = {
  query: string
  page_size: number
  page_number: number
}

export const fetchPaginatedSearchResults = createAsyncThunk<
  PaginatedSearchResult,
  fetchPaginatedSearchResultsArgs
>(
  "paginatedSearchResults/fetchSearchResults",
  async ({query, page_number, page_size}: fetchPaginatedSearchResultsArgs) => {
    const resp = await axios.get("/api/search/", {
      params: {
        q: query,
        page_size: page_size,
        page_number: page_number
      },
      validateStatus: () => true
    })
    let result = resp.data as PaginatedSearchResult
    const resp2 = await axios.get("/api/nodes/", {
      params: {
        node_ids: result.items.map(i =>
          i.entity_type == "folder" ? i.id : i.document_id
        )
      },
      paramsSerializer: {
        indexes: null // no brackets in `node_ids` parameter list
      },
      validateStatus: () => true
    })

    if (result.items.length == 0) {
      return {
        num_pages: result.num_pages,
        page_number: result.page_number,
        page_size: result.page_size,
        items: [],
        query: query
      }
    }

    const result2 = result.items.map(i => {
      const found = resp2.data.find((x: NodeType) =>
        x.ctype == "folder" ? x.id == i.id : x.id == i.document_id
      )
      if (found) {
        i.breadcrumb = found.breadcrumb
        i.tags = found.tags
        return i
      }

      return i
    })

    return {
      num_pages: result.num_pages,
      page_number: result.page_number,
      page_size: result.page_size,
      items: result2,
      query: query
    }
  }
)

export const deleteNodes = createAsyncThunk<string[], string[]>(
  "dualPanel/deleteNodes",
  async (nodeIds: string[]) => {
    await axios.delete("/api/nodes/", {data: nodeIds})

    return nodeIds
  }
)

type SetCurrentPageArg = {
  mode: PanelMode
  page: number
}

type DropThumbnailPageArgs = {
  mode: PanelMode
  sources: PageAndRotOp[]
  target: PageAndRotOp
  position: DroppedThumbnailPosition
}

type RotatePageArg = {
  mode: PanelMode
  angle: number
  pages: PageType[]
}

const dualPanelSlice = createSlice({
  name: "dualPanel",
  initialState,
  reducers: {
    rotatePages: (state, action: PayloadAction<RotatePageArg>) => {
      const {pages, mode, angle} = action.payload
      const page_ids = pages.map(p => p.id)

      let curVer
      if (mode == "main") {
        curVer = state.mainPanel.viewer?.currentVersion
        if (curVer && curVer > 0) {
          let foundPages = state.mainPanel.viewer?.versions[
            curVer - 1
          ].pages.filter(p => page_ids.includes(p.page.id))
          if (foundPages) {
            for (let i = 0; i < foundPages.length; i++) {
              foundPages[i].angle = foundPages[i].angle + angle
            }
          }
        }
      }
    },
    resetPageChanges: (state, action: PayloadAction<PanelMode>) => {
      const mode = action.payload
      resetPageChangesHelper(state, mode)
    },
    selectionAddPage: (state, action: PayloadAction<SelectionPagePayload>) => {
      const pageId = action.payload.selectionId
      const mode = action.payload.mode
      selectionAddPageHelper(state, pageId, mode)
    },
    selectionRemovePage: (
      state,
      action: PayloadAction<SelectionPagePayload>
    ) => {
      const pageId = action.payload.selectionId
      const mode = action.payload.mode
      selectionRemovePageHelper(state, pageId, mode)
    },
    dropThumbnailPage(state, action: PayloadAction<DropThumbnailPageArgs>) {
      const {mode, sources, target, position} = action.payload

      dropThumbnailPageHelper({
        state,
        mode,
        sources,
        target,
        position
      })
    },
    incZoomFactor(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        if (state.mainPanel.viewer) {
          let zoom = state.mainPanel.viewer?.zoomFactor
          if (zoom && zoom + ZOOM_FACTOR_STEP < MAX_ZOOM_FACTOR) {
            state.mainPanel.viewer.zoomFactor = zoom + ZOOM_FACTOR_STEP
          }
        }
      }
      if (mode == "secondary") {
        if (state.secondaryPanel?.viewer) {
          let zoom = state.secondaryPanel.viewer.zoomFactor
          if (zoom && zoom + ZOOM_FACTOR_STEP < MAX_ZOOM_FACTOR) {
            state.secondaryPanel.viewer.zoomFactor = zoom + ZOOM_FACTOR_STEP
          }
        }
      }
    },
    decZoomFactor(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        if (state.mainPanel.viewer) {
          let zoom = state.mainPanel.viewer?.zoomFactor
          if (zoom && zoom - ZOOM_FACTOR_STEP > MIN_ZOOM_FACTOR) {
            state.mainPanel.viewer.zoomFactor = zoom - ZOOM_FACTOR_STEP
          }
        }
      }
      if (mode == "secondary") {
        if (state.secondaryPanel?.viewer) {
          let zoom = state.secondaryPanel.viewer.zoomFactor
          if (zoom && zoom - ZOOM_FACTOR_STEP > MIN_ZOOM_FACTOR) {
            state.secondaryPanel.viewer.zoomFactor = zoom - ZOOM_FACTOR_STEP
          }
        }
      }
    },
    fitZoomFactor(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        if (state.mainPanel.viewer) {
          state.mainPanel.viewer.zoomFactor = 100
        }
      }
      if (mode == "secondary") {
        if (state.secondaryPanel?.viewer) {
          state.secondaryPanel.viewer.zoomFactor = 100
        }
      }
    },
    toggleThumbnailsPanel(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        if (state.mainPanel.viewer) {
          const new_value = !state.mainPanel.viewer.thumbnailsPanelOpen
          state.mainPanel.viewer.thumbnailsPanelOpen = new_value
          if (new_value) {
            Cookies.set(MAIN_THUMBNAILS_PANEL_OPENED_COOKIE, "true")
          } else {
            Cookies.set(MAIN_THUMBNAILS_PANEL_OPENED_COOKIE, "false")
          }
        }
      }

      if (mode == "secondary") {
        if (state.secondaryPanel?.viewer) {
          const new_value = !state.secondaryPanel.viewer.thumbnailsPanelOpen
          state.secondaryPanel.viewer.thumbnailsPanelOpen = new_value
          if (new_value) {
            Cookies.set(SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE, "true")
          } else {
            Cookies.set(SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE, "false")
          }
        }
      }
    },
    openSecondaryPanel(state, action: PayloadAction<CurrentNodeType>) {
      state.secondaryPanel = {
        viewer: null,
        searchResults: null
      }
    },
    closeSecondaryPanel(state) {
      state.secondaryPanel = null
    },
    updateSearchResultItemTarget: (state, action: PayloadAction<PanelType>) => {
      const targetPanel: PanelType = action.payload
      if (state?.mainPanel?.searchResults) {
        state.mainPanel.searchResults.openItemTargetPanel = targetPanel
      }
    },
    setCurrentPage: (state, action: PayloadAction<SetCurrentPageArg>) => {
      const mode = action.payload.mode
      const page = action.payload.page

      if (mode == "main") {
        if (state?.mainPanel.viewer) {
          state.mainPanel.viewer.currentPage = page
        }
      }

      if (mode == "secondary") {
        if (state?.secondaryPanel?.viewer) {
          state.secondaryPanel.viewer.currentPage = page
        }
      }
    }
  },
  extraReducers(builder) {
    builder.addCase(applyPageOpChanges.fulfilled, (state, action) => {
      if (action.meta.arg.panel == "main") {
        const versionNumbers = action.payload.versions.map(v => v.number)
        state.mainPanel.viewer = {
          breadcrumb: action.payload.breadcrumb,
          versions: injectPageRotOp(action.payload.versions),
          currentVersion: Math.max(...versionNumbers),
          currentPage: 1,
          thumbnailsPanelOpen: mainThumbnailsPanelInitialState(),
          zoomFactor: 100,
          selectedIds: [],
          //@ts-ignore
          initialPages: getLatestVersionPages(action.payload.versions)
        }
        return
      }

      if (action.meta.arg.panel == "secondary") {
        const versionNumbers = action.payload.versions.map(v => v.number)
        state.secondaryPanel = {
          commander: null,
          searchResults: null,
          viewer: {
            breadcrumb: action.payload.breadcrumb,
            versions: injectPageRotOp(action.payload.versions),
            currentVersion: Math.max(...versionNumbers),
            currentPage: 1,
            thumbnailsPanelOpen: secondaryThumbnailsPanelInitialState(),
            zoomFactor: 100,
            selectedIds: [],
            //@ts-ignore
            initialPages: getLatestVersionPages(action.payload.versions)
          }
        }
        return
      }
    })
    builder.addCase(fetchPaginatedSearchResults.fulfilled, (state, action) => {
      state.mainPanel = {
        viewer: null,
        searchResults: {
          pagination: {
            numPages: action.payload.num_pages,
            pageNumber: action.payload.page_number,
            pageSize: action.payload.page_size
          },
          items: {
            data: action.payload.items,
            status: "succeeded",
            error: null
          },
          openItemTargetPanel: "secondary",
          query: action.payload.query
        }
      }
    })
  }
})

export const {
  rotatePages,
  incZoomFactor,
  decZoomFactor,
  fitZoomFactor,
  toggleThumbnailsPanel,
  openSecondaryPanel,
  closeSecondaryPanel,
  selectionAddPage,
  selectionRemovePage,
  updateSearchResultItemTarget,
  setCurrentPage,
  dropThumbnailPage,
  resetPageChanges
} = dualPanelSlice.actions

export default dualPanelSlice.reducer

export const selectMainPanel = (state: RootState) => state.dualPanel.mainPanel
export const selectSecondaryPanel = (state: RootState) =>
  state.dualPanel.secondaryPanel

export const selectViewer = (state: RootState, mode: PanelMode) => {
  if (mode === "main") {
    return state.dualPanel.mainPanel.viewer
  }

  return state.dualPanel.secondaryPanel?.viewer
}

export const selectSearchResults = (state: RootState, mode: PanelMode) => {
  if (mode === "main") {
    return state.dualPanel.mainPanel.searchResults
  }

  return null
}

export const selectSearchResultItems = (
  state: RootState,
  mode: PanelMode
): SliceState<Array<SearchResultNode>> | null | undefined => {
  if (mode === "main") {
    return state.dualPanel.mainPanel.searchResults?.items
  }

  return null
}

export const selectSelectedPageIds = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.viewer?.selectedIds
  }

  return state.dualPanel.secondaryPanel?.viewer?.selectedIds
}

export const selectInitialPages = (
  state: RootState,
  mode: PanelMode
): Array<PageAndRotOp> | undefined => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.viewer?.initialPages
  }

  return state.dualPanel.secondaryPanel?.viewer?.initialPages
}

export const selectPagesRaw = (
  state: RootState,
  mode: PanelMode
): Array<PageAndRotOp> | undefined => {
  let verNumber
  let ver

  if (mode == "main") {
    verNumber = state.dualPanel.mainPanel?.viewer?.currentVersion
    if (
      verNumber &&
      state.dualPanel.mainPanel?.viewer?.versions &&
      state.dualPanel.mainPanel?.viewer?.versions.length >= verNumber
    ) {
      ver = state.dualPanel.mainPanel?.viewer?.versions[verNumber - 1]
      if (ver) {
        return ver.pages
      }
    }
  } else {
    verNumber = state.dualPanel.secondaryPanel?.viewer?.currentVersion
    if (
      verNumber &&
      state.dualPanel.secondaryPanel?.viewer?.versions &&
      state.dualPanel.secondaryPanel?.viewer?.versions.length >= verNumber
    ) {
      ver = state.dualPanel.secondaryPanel?.viewer?.versions[verNumber - 1]
      if (ver) {
        return ver.pages
      }
    }
  }
}

export const selectSelectedPages = createSelector(
  [selectSelectedPageIds, selectPagesRaw],
  (
    selectedIds: Array<string> | undefined,
    allNodes: Array<PageAndRotOp> | undefined
  ): Array<PageAndRotOp> => {
    if (selectedIds && allNodes) {
      return Object.values(allNodes).filter((i: PageAndRotOp) =>
        selectedIds.includes(i.page.id)
      )
    }

    return []
  }
)

export const selectPagesHaveChanged = createSelector(
  [selectInitialPages, selectPagesRaw],
  (
    initialPages: Array<PageAndRotOp> | undefined,
    currentPages: Array<PageAndRotOp> | undefined
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
      if (initialPages[i].page.id != currentPages[i].page.id) {
        return true
      }

      if (initialPages[i].page.number != currentPages[i].page.number) {
        return true
      }

      if (initialPages[i].angle != currentPages[i].angle) {
        return true
      }
    }

    return false
  }
)

export const selectDocumentVersions = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    if (state.dualPanel.mainPanel.viewer) {
      return state.dualPanel.mainPanel.viewer.versions
    }
  }

  if (state.dualPanel.secondaryPanel?.viewer) {
    return state.dualPanel.secondaryPanel?.viewer.versions
  }
}

export const selectDocumentCurrentVersionNumber = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    if (state.dualPanel.mainPanel.viewer) {
      return state.dualPanel.mainPanel.viewer.currentVersion
    }
  }

  if (state.dualPanel.secondaryPanel?.viewer) {
    return state.dualPanel.secondaryPanel?.viewer.currentVersion
  }
}

export const selectDocumentCurrentVersion = createSelector(
  [selectDocumentVersions, selectDocumentCurrentVersionNumber],
  (versions, number) => {
    if (versions && versions.length && number !== undefined && number != null) {
      return versions[number - 1]
    }
  }
)

export const selectDocumentCurrentPage = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    if (state.dualPanel.mainPanel.viewer) {
      return state.dualPanel.mainPanel.viewer.currentPage || 1
    }
  }

  if (state.dualPanel.secondaryPanel?.viewer) {
    return state.dualPanel.secondaryPanel?.viewer.currentPage || 1
  }

  return 1
}

export const selectSearchResultOpenItemTarget = (
  state: RootState
): PanelType => {
  if (state.dualPanel.mainPanel.searchResults) {
    return (
      state.dualPanel.mainPanel.searchResults.openItemTargetPanel || "secondary"
    )
  }

  return "secondary"
}

export const selectSearchPagination = (state: RootState) =>
  state.dualPanel.mainPanel?.searchResults?.pagination

export const selectSearchQuery = (state: RootState) =>
  state.dualPanel.mainPanel?.searchResults?.query

export const selectSearchPageSize = (state: RootState) =>
  state.dualPanel.mainPanel?.searchResults?.pagination?.pageSize

export const selectSearchPageNumber = (state: RootState) =>
  state.dualPanel.mainPanel?.searchResults?.pagination?.pageNumber

export const selectThumbnailsPanelOpen = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.viewer?.thumbnailsPanelOpen
  }

  return Boolean(state.dualPanel?.secondaryPanel?.viewer?.thumbnailsPanelOpen)
}

export const selectZoomFactor = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.viewer?.zoomFactor
  }

  return state.dualPanel.secondaryPanel?.viewer?.zoomFactor
}

function mainThumbnailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    MAIN_THUMBNAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}

function secondaryThumbnailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}

function injectPageRotOp(
  vers: DocumentVersion[]
): DocumentVersionWithPageRot[] {
  return vers.map(raw => injectPageRotOpForDocVer(raw))
}

function injectPageRotOpForDocVer(
  ver: DocumentVersion
): DocumentVersionWithPageRot {
  let result = ver
  // @ts-ignore
  result.pages = ver.pages.map(p => {
    return {page: p, angle: 0}
  })

  //@ts-ignore
  return result
}
