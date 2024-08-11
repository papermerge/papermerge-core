import type {CurrentNodeType, NodeType, PanelMode} from "@/types"
import {DualPanelState, NodeWithSpinner, Commander} from "./types"
import {INITIAL_PAGE_SIZE} from "@/cconstants"

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

export function setCurrentNodeHelper({
  state,
  node,
  mode
}: {
  state: DualPanelState
  node: CurrentNodeType
  mode: PanelMode
}) {
  if (mode == "main") {
    // main panel
    if (node.ctype == "folder") {
      // commander
      if (state.mainPanel.commander) {
        // preserve breadcrumb
        const prevBreadcrumb = state.mainPanel.commander.currentNode?.breadcrumb
        // just update commander's current node
        state.mainPanel.commander.currentNode = {
          id: node.id,
          ctype: node.ctype,
          breadcrumb: prevBreadcrumb
        }
      } else {
        // re-open commander
        state.mainPanel.commander = commanderInitialState({
          id: node.id,
          ctype: "folder",
          breadcrumb: null
        })
        // close viewer
        state.mainPanel.viewer = null
      }
    } else {
      // viewer. Here node.ctype == "document"
      state.mainPanel.commander = null
      state.mainPanel.viewer = {
        breadcrumb: null,
        versions: [],
        currentVersion: null,
        currentPage: 1,
        thumbnailsPanelOpen: false,
        zoomFactor: 100
      }
    }
  }

  if (mode == "secondary") {
    if (node.ctype == "folder") {
      if (state.secondaryPanel?.commander) {
        // preserve breadcrumb
        const prevBreadcrumb =
          state.secondaryPanel.commander.currentNode?.breadcrumb
        state.secondaryPanel.commander.currentNode = {
          id: node.id,
          ctype: node.ctype,
          breadcrumb: prevBreadcrumb
        }
      } else {
        // re-open commander
        state.secondaryPanel = {
          commander: commanderInitialState({
            id: node.id,
            ctype: "folder",
            breadcrumb: null
          }),
          viewer: null,
          searchResults: null
        }
        // close viewer
        state.secondaryPanel.viewer = null
      }
    } else {
      // viewer. Here node.ctype == "document"
      state.secondaryPanel = {
        commander: null,
        viewer: {
          breadcrumb: null,
          versions: [],
          currentVersion: null,
          currentPage: 1,
          thumbnailsPanelOpen: false,
          zoomFactor: 100
        },
        searchResults: null
      }
    }
  }
}
export function nodeUpdatedHelper({
  state,
  node
}: {
  state: DualPanelState
  node: NodeType
}) {
  const newNodes = state.nodes.map(n => {
    if (n.id != node.id) {
      return n
    }
    return node
  })

  state.nodes = newNodes
}

export function nodeAddedHelper({
  state,
  node,
  mode
}: {
  state: DualPanelState
  node: NodeType
  mode: PanelMode
}) {
  // in case panels are equal (i.e. both have same current node) ->
  // both panels need to be updated
  const addToBothPanels = equalPanels(state)

  // first add node data in common list of nodes
  state.nodes.push(node)

  // update list of ids in main panel
  if (mode == "main" || addToBothPanels) {
    state.mainPanel.commander?.nodes.data!.push({
      id: node.id,
      status: "idle"
    })
  }

  // update list of ids in secondary panel
  if (mode == "secondary" || addToBothPanels) {
    state.secondaryPanel!.commander?.nodes.data!.push({
      id: node.id,
      status: "idle"
    })
  }
}

export function commanderInitialState(node: CurrentNodeType | null): Commander {
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

/** Returns true if and only if both panels are of same type
  (e.g. commander, commander; or viewer, viewer)
  and their current node (ID) is the same */
export function equalPanels(state: DualPanelState): boolean {
  if (!state.secondaryPanel) {
    return false
  }

  if (state.mainPanel.commander && state.secondaryPanel.commander) {
    const mainID = state.mainPanel.commander.currentNode?.id
    const secondaryID = state.secondaryPanel.commander.currentNode?.id

    if (mainID && secondaryID) {
      return mainID == secondaryID
    }
  }

  return false
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
