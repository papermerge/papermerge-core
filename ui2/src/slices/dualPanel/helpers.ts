import type {NodeType, PanelMode} from "@/types"
import {DualPanelState, NodeWithSpinner} from "./types"

export function selectionAddNodeHelper(
  state: DualPanelState,
  nodeId: string,
  mode: PanelMode
) {
  switch (mode) {
    case "main":
      if (state.mainPanel.commander) {
        state.mainPanel.commander.selectedIds.push(nodeId)
      }
      break
    case "secondary":
      if (state.secondaryPanel?.commander) {
        state.secondaryPanel.commander.selectedIds.push(nodeId)
      }
      break
    default:
      throw Error("Should never reach this place")
  }
}

export function selectionRemoveNodeHelper(
  state: DualPanelState,
  nodeId: string,
  mode: PanelMode
) {
  if (mode == "main") {
    if (state.mainPanel.commander) {
      const newSelectedIds = state.mainPanel.commander.selectedIds.filter(
        i => i != nodeId
      )
      state.mainPanel.commander.selectedIds = newSelectedIds
    }
  }

  if (mode == "secondary") {
    if (state.secondaryPanel?.commander) {
      const newSelectedIds = state.secondaryPanel.commander.selectedIds.filter(
        i => i != nodeId
      )
      state.secondaryPanel.commander.selectedIds = newSelectedIds
    }
  }
}

export function clearNodesSelectionHelper(
  state: DualPanelState,
  mode: PanelMode
) {
  if (mode == "main") {
    if (state.mainPanel.commander) {
      state.mainPanel.commander.selectedIds = []
    }
  }
  if (mode == "secondary") {
    if (state.secondaryPanel?.commander) {
      state.secondaryPanel.commander.selectedIds = []
    }
  }
}

export function removeNodesHelper(state: DualPanelState, nodeIds: string[]) {
  /* Removes nodes from:
    - `dualPanel.mainPanel.commander.nodes`
    - `dualPanel.secondaryPanel.commander.nodes`
    - `dualPanel.nodes`
  */
  const newMainNodes = _removePanelNodes(state, nodeIds, "main")
  const newSecondaryNodes = _removePanelNodes(state, nodeIds, "secondary")
  const newNodes = _removeNodes(state, nodeIds)

  if (newMainNodes && state.mainPanel.commander) {
    state.mainPanel.commander.nodes.data = newMainNodes
  }
  if (newSecondaryNodes && state.secondaryPanel?.commander) {
    state.secondaryPanel.commander.nodes.data = newSecondaryNodes
  }
  if (newNodes && state.nodes) {
    state.nodes = newNodes
  }
}

function _removePanelNodes(
  state: DualPanelState,
  idsToRemove: string[],
  mode: PanelMode
): NodeWithSpinner[] | null | undefined {
  const data = state[`${mode}Panel`]?.commander?.nodes?.data

  if (data) {
    const nodes = Object.values(data || [])
    const newNodes = nodes.filter((n: {id: string}) => {
      // if it is one of the IDs to remove - filter it out
      if (idsToRemove.includes(n.id)) {
        return false
      }
      return true
    })
    return newNodes
  }

  return data
}

function _removeNodes(
  state: DualPanelState,
  idsToRemove: string[]
): NodeType[] | null | undefined {
  if (state.nodes) {
    const nodes = Object.values(state.nodes || [])
    const newNodes = nodes.filter((n: {id: string}) => {
      if (idsToRemove.includes(n.id)) {
        return false
      }
      return true
    })
    return newNodes
  }
  return state.nodes
}
