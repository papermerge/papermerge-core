import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {RootState} from "@/app/types"
import type {SliceState, NodeType, PanelMode} from "@/types"

type NodeWithSpinner = {
  id: string
  // When user clicks a node in commander, respective node
  // gives user immediate feedback by showing rotating spinner
  // next to the node (i.e. I got your click => now loading subfolder/doc)
  status: "idle" | "loading"
}

type PanelCurrentFolder = {
  id: string
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
  nodes: SliceState<Array<NodeType>>
}

const initialState: DualPanelState = {
  mainPanel: {
    commander: {
      currentNode: null,
      pageSize: 15,
      pageNumber: 1,
      sort: "-title",
      nodes: {
        status: "idle",
        error: null,
        data: null
      }
    },
    viewer: null
  },
  secondaryPanel: null,
  nodes: {
    status: "idle",
    error: null,
    data: []
  }
}

const dualPanelSlice = createSlice({
  name: "dualPanel",
  initialState,
  reducers: {
    setCurrentFolder(state, action: PayloadAction<PanelCurrentFolder>) {}
  }
})

export const {setCurrentFolder} = dualPanelSlice.actions
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
