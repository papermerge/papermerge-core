import {createSlice, PayloadAction, createAsyncThunk} from "@reduxjs/toolkit"
import {getBaseURL, getDefaultHeaders} from "@/utils"

import axios from "axios"

axios.defaults.baseURL = getBaseURL()
axios.defaults.headers.common = getDefaultHeaders()

import {RootState} from "@/app/types"

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
import {INITIAL_PAGE_SIZE} from "@/cconstants"

type NodeWithSpinner = {
  id: string
  // When user clicks a node in commander, respective node
  // gives user immediate feedback by showing rotating spinner
  // next to the node (i.e. I got your click => now loading subfolder/doc)
  status: "idle" | "loading"
}

type SetCurrentNodeArgs = {
  node: CurrentNodeType
  panel: PanelMode
}

type FolderAddedArgs = {
  node: NodeType
  mode: PanelMode
}

type SelectionNodePayload = {
  selectionId: string
  mode: PanelMode
}

type SelectionNodesPayload = {
  selectionIds: Array<string>
  mode: PanelMode
}

interface Commander {
  currentNode: CurrentNodeType | null
  pagination: PaginationType | null | undefined
  lastPageSize: number
  nodes: SliceState<Array<NodeWithSpinner>>
  selectedIds: Array<string>
}

interface Viewer {}

interface SinglePanel {
  commander: Commander | null
  viewer: Viewer | null
}

interface DualPanelState {
  mainPanel: SinglePanel
  secondaryPanel: SinglePanel | null
  nodes: Array<NodeType>
}

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
      if (action.payload.mode == "main") {
        if (state.mainPanel.commander) {
          state.mainPanel.commander.selectedIds.push(action.payload.selectionId)
        }
      } else {
        if (state.secondaryPanel?.commander) {
          state.secondaryPanel.commander.selectedIds.push(
            action.payload.selectionId
          )
        }
      }
    },
    selectionAddNodes: (
      state,
      action: PayloadAction<SelectionNodesPayload>
    ) => {
      if (action.payload.mode == "main") {
        // main panel / commander
        if (state.mainPanel.commander) {
          state.mainPanel.commander.selectedIds = action.payload.selectionIds
        }
      } else {
        // secondary panel / commander
        if (state.secondaryPanel?.commander) {
          state.secondaryPanel.commander.selectedIds =
            action.payload.selectionIds
        }
      }
    },
    selectionRemoveNode: (
      state,
      action: PayloadAction<SelectionNodePayload>
    ) => {
      if (action.payload.mode == "main") {
        if (state.mainPanel.commander) {
          const newSelectedIds = state.mainPanel.commander.selectedIds.filter(
            i => i != action.payload.selectionId
          )
          state.mainPanel.commander.selectedIds = newSelectedIds
        }
      } else {
        if (state.secondaryPanel?.commander) {
          const newSelectedIds =
            state.secondaryPanel.commander.selectedIds.filter(
              i => i != action.payload.selectionId
            )
          state.secondaryPanel.commander.selectedIds = newSelectedIds
        }
      }
    },
    clearNodesSelection: (state, action: PayloadAction<string>) => {
      if (action.payload == "main") {
        if (state.mainPanel.commander) {
          state.mainPanel.commander.selectedIds = []
        }
      } else {
        if (state.secondaryPanel?.commander) {
          state.secondaryPanel.commander.selectedIds = []
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
  }
})

export const {
  setCurrentNode,
  folderAdded,
  openSecondaryPanel,
  closeSecondaryPanel,
  selectionAddNode,
  selectionAddNodes,
  selectionRemoveNode,
  clearNodesSelection
} = dualPanelSlice.actions

export default dualPanelSlice.reducer

export const selectMainCurrentFolderId = (state: RootState) =>
  state.dualPanel.mainPanel.commander?.currentNode

export const selectPanels = (state: RootState) => {
  return [state.dualPanel.mainPanel, state.dualPanel.secondaryPanel]
}

export const selectPanelComponents = (state: RootState, mode: PanelMode) => {
  if (mode === "main") {
    return [
      state.dualPanel.mainPanel.commander,
      state.dualPanel.mainPanel.viewer
    ]
  }

  return [
    state.dualPanel.secondaryPanel?.commander,
    state.dualPanel.secondaryPanel?.viewer
  ]
}

export const selectPanelNodes = (
  state: RootState,
  mode: PanelMode
): SliceState<Array<NodeType>> => {
  if (mode === "main") {
    if (state.dualPanel.mainPanel.commander) {
      return selectMainPanelNodes(state)
    }
  }

  if (state.dualPanel.secondaryPanel?.commander) {
    return selectSecondaryPanelNodes(state)
  }

  return {
    data: null,
    error: null,
    status: "idle"
  }
}

const selectMainPanelNodes = (
  state: RootState
): SliceState<Array<NodeType>> => {
  if (state.dualPanel.mainPanel!.commander!.nodes.data) {
    const nodeIds = state.dualPanel.mainPanel.commander!.nodes.data!.map(
      (n: NodeWithSpinner) => n.id
    )
    const output = {
      status: "succeeded",
      error: null,
      data: state.dualPanel.nodes.filter((n: NodeType) =>
        nodeIds.includes(n.id)
      )
    } as SliceState<Array<NodeType>>
    return output
  }

  return {
    status: state.dualPanel.mainPanel!.commander!.nodes.status,
    error: state.dualPanel.mainPanel!.commander!.nodes.error,
    data: null
  }
}

const selectSecondaryPanelNodes = (
  state: RootState
): SliceState<Array<NodeType>> => {
  if (state.dualPanel.secondaryPanel!.commander!.nodes.data) {
    const nodeIds = state.dualPanel.secondaryPanel!.commander!.nodes.data!.map(
      (n: NodeWithSpinner) => n.id
    )
    return {
      status: "succeeded",
      error: null,
      data: state.dualPanel.nodes.filter((n: NodeType) =>
        nodeIds.includes(n.id)
      )
    }
  }

  return {
    status: state.dualPanel.secondaryPanel!.commander!.nodes.status,
    error: state.dualPanel.secondaryPanel!.commander!.nodes.error,
    data: null
  }
}

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
