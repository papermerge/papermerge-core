import {createSlice, PayloadAction, createAsyncThunk} from "@reduxjs/toolkit"
import axios from "axios"

import {RootState} from "@/app/types"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"

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

type PanelCurrentNode = {
  node: NType
  panel: PanelMode
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
  const rest_api_url = getRestAPIURL()
  const defaultHeaders = getDefaultHeaders()

  const prom = axios.all([
    axios.get(`${rest_api_url}/api/nodes/${folderId}?${urlParams}`, {
      headers: defaultHeaders
    }),
    axios.get(`${rest_api_url}/api/folders/${folderId}`, {
      headers: defaultHeaders
    })
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
    setCurrentNode(state, action: PayloadAction<PanelCurrentNode>) {
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
          state.mainPanel.commander.nodes.data = newNodes
          state.mainPanel.commander.pageNumber = 1
        }
      } else if (state.secondaryPanel && state.secondaryPanel.commander) {
        state.secondaryPanel.commander.nodes.data = newNodes
        state.secondaryPanel.commander.pageNumber = 1
      }
    })
  }
})

export const {setCurrentNode} = dualPanelSlice.actions
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

export const selectPanelNodes = (state: RootState, mode: PanelMode) => {
  if (mode === "main") {
    if (
      state.dualPanel.mainPanel.commander &&
      state.dualPanel.mainPanel.commander.nodes.data
    ) {
      const nodeIds = state.dualPanel.mainPanel.commander.nodes.data.map(
        (n: NodeWithSpinner) => n.id
      )
      return state.dualPanel.nodes.filter((n: NodeType) =>
        nodeIds.includes(n.id)
      )
    }
  }
}
