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
  NType,
  Paginated,
  NodeLoaderResponseType,
  FolderType
} from "@/types"

type NodeWithSpinner = {
  id: string
  // When user clicks a node in commander, respective node
  // gives user immediate feedback by showing rotating spinner
  // next to the node (i.e. I got your click => now loading subfolder/doc)
  status: "idle" | "loading"
}

type SetCurrentNodeArgs = {
  node: NType
  panel: PanelMode
}

type FolderAddedArgs = {
  node: NodeType
  mode: PanelMode
}

interface Commander {
  currentNode: string | null
  pageSize: number
  pageNumber: number
  sort: string
  nodes: SliceState<Array<NodeWithSpinner>>
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

function commanderInitialState(folderId: string | null): Commander {
  return {
    currentNode: folderId,
    pageSize: 15,
    pageNumber: 1,
    sort: "-title",
    nodes: {
      status: "idle",
      error: null,
      data: null
    }
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
            // just update commander's current node
            state.mainPanel.commander.currentNode = action.payload.node.id
          } else {
            // re-open commander
            state.mainPanel.commander = commanderInitialState(
              action.payload.node.id
            )
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
    openSecondaryPanel(state) {
      state.secondaryPanel = {
        commander: commanderInitialState(null),
        viewer: null
      }
    },
    closeSecondaryPanel(state) {
      state.secondaryPanel = null
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
        }
      } else if (state.secondaryPanel && state.secondaryPanel.commander) {
        state.secondaryPanel.commander.nodes = {
          status: "succeeded",
          error: null,
          data: newNodes
        }
      }
    })
  }
})

export const {
  setCurrentNode,
  folderAdded,
  openSecondaryPanel,
  closeSecondaryPanel
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
  if (state.dualPanel.mainPanel.commander!.nodes.status == "succeeded") {
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
  } else {
    // main panel commander nodes are either loading or there was an error
    return {
      status: state.dualPanel.mainPanel.commander!.nodes.status,
      error: state.dualPanel.mainPanel.commander!.nodes.error,
      data: null
    }
  }
}

const selectSecondaryPanelNodes = (
  state: RootState
): SliceState<Array<NodeType>> => {
  if (state.dualPanel.secondaryPanel!.commander!.nodes.status == "succeeded") {
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
  } else {
    // secondary panel commander nodes are either loading or there was an error
    return {
      status: state.dualPanel.secondaryPanel!.commander!.nodes.status,
      error: state.dualPanel.secondaryPanel!.commander!.nodes.error,
      data: null
    }
  }
}

export const selectCurrentFolderID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.dualPanel.mainPanel.commander?.currentNode
  }

  if (state.dualPanel.secondaryPanel?.commander) {
    return state.dualPanel.secondaryPanel.commander.currentNode
  }

  return null
}
