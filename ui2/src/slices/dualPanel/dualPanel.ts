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
  removeNodesHelper,
  selectionAddNodeHelper,
  selectionRemoveNodeHelper,
  clearNodesSelectionHelper,
  commanderInitialState,
  setCurrentNodeHelper,
  nodeAddedHelper,
  nodeUpdatedHelper
} from "./helpers"

import type {
  SliceState,
  NodeType,
  PanelMode,
  PanelType,
  Paginated,
  NodeLoaderResponseType,
  FolderType,
  DocumentType,
  CurrentNodeType,
  PaginationType,
  SliceStateStatus,
  SearchResultNode,
  PaginatedSearchResult
} from "@/types"
import {
  DualPanelState,
  SetCurrentNodeArgs,
  FolderAddedArgs,
  NodeUpdatedArgs,
  NodeWithSpinner,
  SelectionNodePayload
} from "./types"
import {
  INITIAL_PAGE_SIZE,
  MIN_ZOOM_FACTOR,
  MAX_ZOOM_FACTOR,
  ZOOM_FACTOR_STEP
} from "@/cconstants"

const initialState: DualPanelState = {
  mainPanel: {
    commander: commanderInitialState(null),
    viewer: null,
    searchResults: null
  },
  secondaryPanel: null,
  // common nodes data shared between mainPanel and secondary Panel
  nodes: []
}

type ThunkArgs = {
  panel: PanelMode
  nodeId: string
  urlParams: URLSearchParams
  page?: number
}

export const fetchPaginatedDocument = createAsyncThunk<DocumentType, ThunkArgs>(
  "paginatedDocument/fetchDocument",
  // @ts-ignore
  async ({nodeId, urlParams, page}: ThunkArgs) => {
    const response = await axios.get(`/api/documents/${nodeId}`, {
      validateStatus: () => true
    })
    const doc = response.data as DocumentType
    return doc
  }
)

export const fetchPaginatedNodes = createAsyncThunk<
  NodeLoaderResponseType,
  ThunkArgs
>("paginatedNodes/fetchNodes", async ({nodeId, urlParams}: ThunkArgs) => {
  const prom = axios.all([
    axios.get(`/api/nodes/${nodeId}?${urlParams}`),
    axios.get(`/api/folders/${nodeId}`)
  ])
  const [nodesResp, folderResp] = await prom

  if (!nodesResp) {
    throw new Response("", {
      status: 404,
      statusText: "Not Found"
    })
  }

  const paginatedNodes = nodesResp.data as Paginated<NodeType>
  const folder = folderResp.data as FolderType

  const result = {
    nodes: paginatedNodes.items,
    parent: folder,
    breadcrumb: folder.breadcrumb,
    per_page: paginatedNodes.page_size,
    num_pages: paginatedNodes.num_pages,
    page_number: paginatedNodes.page_number
  }

  return result
})

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
type StoreNodeInput = {
  folder_id: string
  user_id: string
}

type SetCurrentPageArg = {
  mode: PanelMode
  page: number
}

const dualPanelSlice = createSlice({
  name: "dualPanel",
  initialState,
  reducers: {
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
          state.mainPanel.viewer.thumbnailsPanelOpen =
            !state.mainPanel.viewer.thumbnailsPanelOpen
        }
      }

      if (mode == "secondary") {
        if (state.secondaryPanel?.viewer) {
          state.secondaryPanel.viewer.thumbnailsPanelOpen =
            !state.secondaryPanel.viewer.thumbnailsPanelOpen
        }
      }
    },
    storeHomeNode(state, action: PayloadAction<StoreNodeInput>) {
      const node: NodeType = {
        id: action.payload.folder_id,
        ctype: "folder",
        title: ".home",
        breadcrumb: [],
        tags: [],
        user_id: action.payload.user_id,
        update_at: "",
        ocr_status: "UNKNOWN",
        ocr: false,
        parent_id: null,
        thumbnail_url: null,
        accept_dropped_nodes: false,
        is_currently_dragged: false
      }
      state.nodes.push(node)
    },
    storeInboxNode(state, action: PayloadAction<StoreNodeInput>) {
      const node: NodeType = {
        id: action.payload.folder_id,
        ctype: "folder",
        title: ".inbox",
        breadcrumb: [],
        tags: [],
        user_id: action.payload.user_id,
        update_at: "",
        ocr_status: "UNKNOWN",
        ocr: false,
        parent_id: null,
        thumbnail_url: null,
        accept_dropped_nodes: false,
        is_currently_dragged: false
      }
      state.nodes.push(node)
    },
    nodeAdded(state, action: PayloadAction<FolderAddedArgs>) {
      nodeAddedHelper({
        state,
        node: action.payload.node,
        mode: action.payload.mode
      })
    },
    setCurrentNode(state, action: PayloadAction<SetCurrentNodeArgs>) {
      setCurrentNodeHelper({
        state,
        node: action.payload.node,
        mode: action.payload.panel
      })
    },
    folderAdded(state, action: PayloadAction<FolderAddedArgs>) {
      nodeAddedHelper({
        state,
        node: action.payload.node,
        mode: action.payload.mode
      })
    },
    nodeUpdated(state, action: PayloadAction<NodeUpdatedArgs>) {
      nodeUpdatedHelper({
        state,
        node: action.payload.node
      })
    },
    openSecondaryPanel(state, action: PayloadAction<CurrentNodeType>) {
      state.secondaryPanel = {
        commander: commanderInitialState(action.payload),
        viewer: null,
        searchResults: null
      }
    },
    closeSecondaryPanel(state) {
      state.secondaryPanel = null
    },
    selectionAddNode: (state, action: PayloadAction<SelectionNodePayload>) => {
      const nodeId = action.payload.selectionId
      const mode = action.payload.mode
      selectionAddNodeHelper(state, nodeId, mode)
    },
    selectionRemoveNode: (
      state,
      action: PayloadAction<SelectionNodePayload>
    ) => {
      const nodeId = action.payload.selectionId
      const {mode} = action.payload
      selectionRemoveNodeHelper(state, nodeId, mode)
    },
    clearNodesSelection: (state, action: PayloadAction<PanelMode>) => {
      clearNodesSelectionHelper(state, action.payload)
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
    builder.addCase(fetchPaginatedNodes.fulfilled, (state, action) => {
      action.payload.nodes.forEach((incomingNode: NodeType) => {
        let found = state.nodes.find((i: NodeType) => i.id == incomingNode.id)
        if (found) {
          found = incomingNode
        } else {
          state.nodes.push(incomingNode)
        }
      })

      const found = state.nodes.find(
        (i: NodeType) => i.id == action.payload.parent.id
      )
      if (!found) {
        state.nodes.push(action.payload.parent)
      }

      const newNodes: Array<NodeWithSpinner> = action.payload.nodes.map(
        (n: NodeType) => {
          return {
            id: n.id,
            status: "idle"
          }
        }
      )
      if (action.meta.arg.panel == "main") {
        if (state.mainPanel.commander) {
          state.mainPanel.commander.nodes = {
            status: "succeeded",
            error: null,
            data: newNodes
          }
          if (state.mainPanel.commander.currentNode) {
            state.mainPanel.commander.currentNode.breadcrumb =
              action.payload.breadcrumb
          }
          state.mainPanel.commander.pagination = {
            pageSize: action.payload.per_page,
            pageNumber: action.payload.page_number,
            numPages: action.payload.num_pages
          }
          state.mainPanel.commander.lastPageSize = action.payload.per_page
        }
      } else if (state.secondaryPanel && state.secondaryPanel.commander) {
        state.secondaryPanel.commander.nodes = {
          status: "succeeded",
          error: null,
          data: newNodes
        }
        if (state.secondaryPanel.commander.currentNode) {
          state.secondaryPanel.commander.currentNode.breadcrumb =
            action.payload.breadcrumb
        }
        state.secondaryPanel.commander.pagination = {
          pageSize: action.payload.per_page,
          pageNumber: action.payload.page_number,
          numPages: action.payload.num_pages
        }
        state.secondaryPanel.commander.lastPageSize = action.payload.per_page
      }
    })
    builder.addCase(fetchPaginatedNodes.pending, (state, action) => {
      if (action.meta.arg.panel == "main") {
        if (state.mainPanel.commander) {
          state.mainPanel.commander.nodes.status = "loading"
        }
      }
      if (action.meta.arg.panel == "secondary") {
        if (state.secondaryPanel?.commander) {
          state.secondaryPanel.commander.nodes.status = "loading"
        }
      }
    })
    builder.addCase(
      deleteNodes.fulfilled,
      (state, action: PayloadAction<string[]>) => {
        const nodeIds = action.payload
        removeNodesHelper(state, nodeIds)
      }
    )
    builder.addCase(fetchPaginatedDocument.fulfilled, (state, action) => {
      if (action.meta.arg.panel == "main") {
        const versionNumbers = action.payload.versions.map(v => v.number)
        state.mainPanel.viewer = {
          breadcrumb: action.payload.breadcrumb,
          versions: action.payload.versions,
          currentVersion: Math.max(...versionNumbers),
          currentPage: action.meta.arg.page || 1,
          thumbnailsPanelOpen: false,
          zoomFactor: 100
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
            versions: action.payload.versions,
            currentVersion: Math.max(...versionNumbers),
            currentPage: action.meta.arg.page || 1,
            thumbnailsPanelOpen: false,
            zoomFactor: 100
          }
        }
        return
      }
    })
    builder.addCase(fetchPaginatedSearchResults.fulfilled, (state, action) => {
      state.mainPanel = {
        commander: null,
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
  incZoomFactor,
  decZoomFactor,
  fitZoomFactor,
  toggleThumbnailsPanel,
  setCurrentNode,
  folderAdded,
  nodeUpdated,
  openSecondaryPanel,
  closeSecondaryPanel,
  selectionAddNode,
  selectionRemoveNode,
  clearNodesSelection,
  updateSearchResultItemTarget,
  storeHomeNode,
  storeInboxNode,
  nodeAdded,
  setCurrentPage
} = dualPanelSlice.actions

export default dualPanelSlice.reducer

export const selectMainCurrentFolderId = (state: RootState) =>
  state.dualPanel.mainPanel.commander?.currentNode

export const selectMainPanel = (state: RootState) => state.dualPanel.mainPanel
export const selectSecondaryPanel = (state: RootState) =>
  state.dualPanel.secondaryPanel

export const selectCommander = (state: RootState, mode: PanelMode) => {
  if (mode === "main") {
    return state.dualPanel.mainPanel.commander
  }

  return state.dualPanel.secondaryPanel?.commander
}

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

export const selectPanelNodesRaw = (
  state: RootState,
  mode: PanelMode
): SliceState<Array<NodeWithSpinner>> | undefined => {
  if (mode === "main") {
    if (state.dualPanel.mainPanel.commander) {
      return state.dualPanel.mainPanel.commander.nodes
    }
  }

  return state.dualPanel.secondaryPanel?.commander?.nodes
}

export const selectNodesRaw = (
  state: RootState,
  mode: PanelMode
): Array<NodeType> | undefined => {
  if (mode) {
    // mode is not used here
  }
  return state.dualPanel.nodes
}

export const selectPanelNodes = createSelector(
  [selectPanelNodesRaw, selectNodesRaw],
  (
    panelNodes: SliceState<Array<NodeWithSpinner>> | undefined,
    allNodes: Array<NodeType> | undefined
  ) => {
    const IDLE = {
      data: null,
      status: "idle",
      error: null
    }

    if (!panelNodes) {
      return IDLE
    }

    if (panelNodes?.data && allNodes) {
      const nodeIds = panelNodes?.data.map(n => n.id)

      return {
        status: panelNodes?.status,
        error: panelNodes?.error,
        data: allNodes.filter(n => nodeIds.includes(n.id))
      }
    }

    return {
      status: panelNodes.status,
      error: panelNodes.error,
      data: null
    }
  }
)

export const selectCurrentFolderID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.currentNode?.id
  }

  if (state.dualPanel.secondaryPanel?.commander) {
    return state.dualPanel.secondaryPanel.commander.currentNode?.id
  }

  return null
}

export const selectCurrentFolder = createSelector(
  [selectCurrentFolderID, selectNodesRaw],
  (folderId, nodes) => nodes?.find(i => i.id == folderId)
)

export const selectPanelBreadcrumbs = (
  state: RootState,
  mode: PanelMode
): Array<[string, string]> | null | undefined => {
  if (mode == "main") {
    if (state.dualPanel.mainPanel.commander) {
      return state.dualPanel.mainPanel.commander?.currentNode?.breadcrumb
    } else if (state.dualPanel.mainPanel.viewer) {
      return state.dualPanel.mainPanel.viewer.breadcrumb
    }
  }

  if (mode == "secondary") {
    if (state.dualPanel.secondaryPanel?.commander) {
      return state.dualPanel.secondaryPanel.commander.currentNode?.breadcrumb
    }

    if (state.dualPanel.secondaryPanel?.viewer) {
      return state.dualPanel.secondaryPanel.viewer.breadcrumb
    }
  }

  return null
}

export const selectPagination = (
  state: RootState,
  mode: PanelMode
): PaginationType | null | undefined => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.pagination
  }

  return state.dualPanel.secondaryPanel?.commander?.pagination
}

export const selectLastPageSize = (
  state: RootState,
  mode: PanelMode
): number => {
  if (mode == "main") {
    if (state.dualPanel.mainPanel.commander?.lastPageSize) {
      return state.dualPanel.mainPanel.commander?.lastPageSize
    }
    return INITIAL_PAGE_SIZE
  }

  if (state.dualPanel.secondaryPanel?.commander?.lastPageSize) {
    return state.dualPanel.secondaryPanel?.commander.lastPageSize
  }

  return INITIAL_PAGE_SIZE
}

export const selectPanelNodesStatus = (
  state: RootState,
  mode: PanelMode
): SliceStateStatus => {
  if (mode == "main") {
    if (state.dualPanel.mainPanel.commander) {
      return state.dualPanel.mainPanel.commander?.nodes.status
    }
    return "idle"
  }

  if (state.dualPanel.secondaryPanel?.commander) {
    return state.dualPanel.secondaryPanel?.commander?.nodes.status
  }

  return "idle"
}

export const selectCommanderPageSize = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.pagination?.pageSize
  }

  return state.dualPanel.secondaryPanel?.commander?.pagination?.pageSize
}

export const selectCommanderPageNumber = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.pagination?.pageNumber
  }

  return state.dualPanel.secondaryPanel?.commander?.pagination?.pageNumber
}

export const selectSelectedNodeIds = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.selectedIds
  }

  return state.dualPanel.secondaryPanel?.commander?.selectedIds
}

export const selectSelectedNodes = createSelector(
  [selectSelectedNodeIds, selectNodesRaw],
  (
    selectedIds: Array<string> | undefined,
    allNodes: Array<NodeType> | undefined
  ): Array<NodeType> => {
    if (selectedIds && allNodes) {
      return Object.values(allNodes).filter((i: NodeType) =>
        selectedIds.includes(i.id)
      )
    }

    return []
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
