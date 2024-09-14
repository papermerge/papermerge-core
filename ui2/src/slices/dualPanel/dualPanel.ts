import {getBaseURL, getDefaultHeaders} from "@/utils"
import {PayloadAction, createAsyncThunk, createSlice} from "@reduxjs/toolkit"

import axios from "axios"

axios.defaults.baseURL = getBaseURL()
axios.defaults.headers.common = getDefaultHeaders()

import {RootState} from "@/app/types"

import type {
  NodeType,
  PageAndRotOp,
  PaginatedSearchResult,
  PanelMode,
  PanelType,
  SearchResultNode,
  SliceState
} from "@/types"
import {DualPanelState} from "./types"

const initialState: DualPanelState = {
  mainPanel: {
    viewer: null,
    searchResults: null
  },
  secondaryPanel: null
}

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

type SetCurrentPageArg = {
  mode: PanelMode
  page: number
}

const dualPanelSlice = createSlice({
  name: "dualPanel",
  initialState,
  reducers: {
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

export const {updateSearchResultItemTarget, setCurrentPage} =
  dualPanelSlice.actions

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

export const selectInitialPages = (
  state: RootState,
  mode: PanelMode
): Array<PageAndRotOp> | undefined => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.viewer?.initialPages
  }

  return state.dualPanel.secondaryPanel?.viewer?.initialPages
}

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
