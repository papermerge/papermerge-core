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
  clearNodesSelectionHelper
} from "./helpers"

import type {
  SliceState,
  NodeType,
  PanelMode,
  Paginated,
  NodeLoaderResponseType,
  FolderType,
  CurrentNodeType,
  PaginationType
} from "@/types"
import {
  Commander,
  DualPanelState,
  SetCurrentNodeArgs,
  FolderAddedArgs,
  NodeWithSpinner,
  SelectionNodePayload
} from "./types"
import {INITIAL_PAGE_SIZE} from "@/cconstants"

function commanderInitialState(node: CurrentNodeType | null): Commander {
  return {
    currentNode: node,
    pagination: null,
    lastPageSize: INITIAL_PAGE_SIZE,
    nodes: {
      status: "idle",
      error: null,
      data: null
    },
    selectedIds: []
  }
}

const initialState: DualPanelState = {
  mainPanel: {
    commander: commanderInitialState(null),
    viewer: null
  },
  secondaryPanel: null,
  // common nodes data shared between mainPanel and secondary Panel
  nodes: []
}

type ThunkArgs = {
  panel: PanelMode
  folderId: string
  urlParams: URLSearchParams
}

export const fetchPaginatedNodes = createAsyncThunk<
  NodeLoaderResponseType,
  ThunkArgs
>("paginatedNodes/fetchNodes", async ({folderId, urlParams}: ThunkArgs) => {
  const prom = axios.all([
    axios.get(`/api/nodes/${folderId}?${urlParams}`),
    axios.get(`/api/folders/${folderId}`)
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

export const deleteNodes = createAsyncThunk<string[], string[]>(
  "dualPanel/deleteNodes",
  async (nodeIds: string[]) => {
    await axios.delete("/api/nodes/", {data: nodeIds})

    return nodeIds
  }
)

const dualPanelSlice = createSlice({
  name: "dualPanel",
  initialState,
  reducers: {
    setCurrentNode(state, action: PayloadAction<SetCurrentNodeArgs>) {
      if (action.payload.panel == "main") {
        // main panel
        if (action.payload.node.ctype == "folder") {
          // commander
          if (state.mainPanel.commander) {
            // preserve breadcrumb
            const prevBreadcrumb =
              state.mainPanel.commander.currentNode?.breadcrumb
            // just update commander's current node
            state.mainPanel.commander.currentNode = {
              id: action.payload.node.id,
              ctype: action.payload.node.ctype,
              breadcrumb: prevBreadcrumb
            }
          } else {
            // re-open commander
            state.mainPanel.commander = commanderInitialState({
              id: action.payload.node.id,
              ctype: "folder",
              breadcrumb: null
            })
          }
        } else {
          // viewer
        }
      } else {
        // secondary panel
      }
    },
    folderAdded(state, action: PayloadAction<FolderAddedArgs>) {
      if (action.payload.mode == "main") {
        state.mainPanel.commander?.nodes.data!.push({
          id: action.payload.node.id,
          status: "idle"
        })
      } else {
        state.secondaryPanel!.commander?.nodes.data!.push({
          id: action.payload.node.id,
          status: "idle"
        })
      }
    },
    openSecondaryPanel(state, action: PayloadAction<CurrentNodeType>) {
      state.secondaryPanel = {
        commander: commanderInitialState(action.payload),
        viewer: null
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
  }
})

export const {
  setCurrentNode,
  folderAdded,
  openSecondaryPanel,
  closeSecondaryPanel,
  selectionAddNode,
  selectionRemoveNode,
  clearNodesSelection
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

export const selectPanelBreadcrumbs = (
  state: RootState,
  mode: PanelMode
): Array<[string, string]> | null | undefined => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.currentNode?.breadcrumb
  }

  if (state.dualPanel.secondaryPanel?.commander) {
    return state.dualPanel.secondaryPanel.commander.currentNode?.breadcrumb
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

export const selectPanelNodesStatus = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.nodes.status
  }

  return state.dualPanel.secondaryPanel?.commander?.nodes.status
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

export const selectSelectedNodes = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    const selectedIds = state.dualPanel.mainPanel.commander?.selectedIds
    if (selectedIds) {
      return Object.values(state.dualPanel.nodes).filter((i: NodeType) =>
        selectedIds.includes(i.id)
      )
    }
  }

  const selectedIds = state.dualPanel.secondaryPanel?.commander?.selectedIds
  if (selectedIds) {
    return Object.values(state.dualPanel.nodes).filter((i: NodeType) =>
      selectedIds.includes(i.id)
    )
  }
}
