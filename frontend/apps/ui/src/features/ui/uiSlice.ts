import type {RootState} from "@/app/types"
import type {BooleanString, CType, ClientPage, PanelMode} from "@/types"
import type {PanelComponent} from "@/types.d/ui"
import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"
import Cookies from "js-cookie"

import type {NodeType} from "@/types"

import {DialogVisiblity} from "@/types.d/common"

const COLLAPSED_WIDTH = 55
const FULL_WIDTH = 200
const NAVBAR_COLLAPSED_COOKIE = "navbar_collapsed"
const NAVBAR_WIDTH_COOKIE = "navbar_width"

type CurrentDocVerUpdateArg = {
  mode: PanelMode
  docVerID: string | undefined
}

type DragPageStartedArg = {
  pages: Array<ClientPage>
  docID: string
  docParentID: string
}

type DragNodeStartedArg = {
  nodes: string[]
  sourceFolderID: string
}

interface NavBarState {
  collapsed: boolean
  width: number
}

interface CurrentNodeArgs {
  id: string
  ctype: CType
  panel: PanelMode
}

interface CurrentPageUpdatedArgs {
  pageNumber: number
  panel: PanelMode
}

interface CurrentNode {
  id: string
  ctype: CType
}

interface ViewerState {
  currentDocumentVersion: number
}

interface DragNDropState {
  /*
  Document pages currently being dragged.
  Pages can be dragged from Viewer's Thumbnails panel.
  Pages can be dropped either in same Thumbnail's panel,
  in another thumbnail panel or inside Commander
  */
  pages: Array<ClientPage> | null
  pagesDocID?: string
  pagesDocParentID?: string
  // IDs of the nodes being dragged
  nodeIDs: string[] | null
  // ID of the folder where drag 'n drop started
  // or in other words: parent node ID of the dragged nodes
  // used for cache tag invalidation
  sourceFolderID?: string
}

export type LastHome = {
  label: string
  home_id: string
  user_id?: string
  group_id?: string
}

export type LastInbox = {
  label: string
  inbox_id: string
  user_id?: string
  group_id?: string
}

interface LastHomeArg {
  mode: PanelMode
  last_home: LastHome
}
interface LastInboxArg {
  mode: PanelMode
  last_inbox: LastInbox
}

export interface UIState {
  navbar: NavBarState
  dragndrop?: DragNDropState
  mainViewer?: ViewerState
  secondaryViewer?: ViewerState
  currentSharedNode?: CurrentNode
  currentSharedRootID?: string
  /* User may choose between own and group homes
   this field indicates his/her last selection */
  mainCommanderLastHome?: LastHome
  mainCommanderLastInbox?: LastInbox
  /* User may choose between own and group homes
   this field indicates his/her last selection */
  secondaryCommanderLastHome?: LastHome
  secondaryCommanderLastInbox?: LastInbox
  /* Which component should main panel display:
    commander, viewer or search results? */
  mainPanelComponent?: PanelComponent
  secondaryPanelComponent?: PanelComponent
  mainViewerCurrentDocVerID?: string
  /* current page (number) in main viewer */
  mainViewerCurrentPageNumber?: number
  secondaryViewerCurrentDocVerID?: string
  /* current page (number) in secondary viewer */
  secondaryViewerCurrentPageNumber?: number
  viewerPageHaveChangedDialogVisibility?: DialogVisiblity
}

const initialState: UIState = {
  navbar: {
    collapsed: initial_collapse_value(),
    width: initial_width_value()
  }
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    // ---------------------------------------------------------
    toggleNavBar(state) {
      if (state.navbar.collapsed) {
        state.navbar.collapsed = false
        state.navbar.width = FULL_WIDTH
        Cookies.set(NAVBAR_COLLAPSED_COOKIE, "false")
        Cookies.set(NAVBAR_WIDTH_COOKIE, `${FULL_WIDTH}`)
      } else {
        state.navbar.collapsed = true
        state.navbar.width = COLLAPSED_WIDTH
        Cookies.set(NAVBAR_COLLAPSED_COOKIE, "true")
        Cookies.set(NAVBAR_WIDTH_COOKIE, `${COLLAPSED_WIDTH}`)
      }
    },
    mainPanelComponentUpdated(state, action: PayloadAction<PanelComponent>) {
      state.mainPanelComponent = action.payload
    },
    secondaryPanelComponentUpdated(
      state,
      action: PayloadAction<PanelComponent | undefined>
    ) {
      state.secondaryPanelComponent = action.payload
    },

    currentSharedNodeChanged(state, action: PayloadAction<CurrentNodeArgs>) {
      const payload = action.payload

      state.currentSharedNode = {
        id: payload.id,
        ctype: payload.ctype
      }
      if (payload.ctype == "folder") {
        state.mainPanelComponent = "sharedCommander"
      }
      if (payload.ctype == "document") {
        state.mainPanelComponent = "sharedViewer"
      }
    }, // end of currentSharedNodeChanged
    currentSharedNodeRootChanged(
      state,
      action: PayloadAction<string | undefined>
    ) {
      state.currentSharedRootID = action.payload
    },
    lastHomeUpdated(state, action: PayloadAction<LastHomeArg>) {
      const {mode, last_home} = action.payload
      if (mode == "main") {
        state.mainCommanderLastHome = last_home
      } else {
        state.secondaryCommanderLastHome = last_home
      }
    },
    lastInboxUpdated(state, action: PayloadAction<LastInboxArg>) {
      const {mode, last_inbox} = action.payload
      if (mode == "main") {
        state.mainCommanderLastInbox = last_inbox
      } else {
        state.secondaryCommanderLastInbox = last_inbox
      }
    },
    viewerCurrentPageUpdated(
      state,
      action: PayloadAction<CurrentPageUpdatedArgs>
    ) {
      const {pageNumber, panel} = action.payload

      if (panel == "main") {
        state.mainViewerCurrentPageNumber = pageNumber
        return
      }

      state.secondaryViewerCurrentPageNumber = pageNumber
    },
    currentDocVerUpdated(state, action: PayloadAction<CurrentDocVerUpdateArg>) {
      const {mode, docVerID} = action.payload
      if (mode == "main") {
        state.mainViewerCurrentDocVerID = docVerID
      } else {
        state.secondaryViewerCurrentDocVerID = docVerID
      }
    },
    dragPagesStarted(state, action: PayloadAction<DragPageStartedArg>) {
      const {pages, docID, docParentID} = action.payload
      if (state.dragndrop) {
        state.dragndrop.pages = pages
        state.dragndrop.pagesDocID = docID
        state.dragndrop.pagesDocParentID = docParentID
      } else {
        state.dragndrop = {
          pages: pages,
          pagesDocID: docID,
          pagesDocParentID: docParentID,
          nodeIDs: null
        }
      }
    },
    dragNodesStarted(state, action: PayloadAction<DragNodeStartedArg>) {
      const {nodes, sourceFolderID} = action.payload

      if (state.dragndrop) {
        state.dragndrop.nodeIDs = nodes
        state.dragndrop.sourceFolderID = sourceFolderID
      } else {
        state.dragndrop = {
          nodeIDs: nodes,
          sourceFolderID: sourceFolderID,
          pages: null
        }
      }
    },
    dragEnded(state) {
      if (state.dragndrop) {
        state.dragndrop = undefined
      }
    },
    viewerPageHaveChangedDialogVisibilityChanged(
      state,
      action: PayloadAction<{visibility: DialogVisiblity}>
    ) {
      const newVisibility = action.payload.visibility
      state.viewerPageHaveChangedDialogVisibility = newVisibility
    }
  }
})

export const {
  toggleNavBar,
  currentSharedNodeChanged,
  currentSharedNodeRootChanged,
  mainPanelComponentUpdated,
  secondaryPanelComponentUpdated,
  viewerCurrentPageUpdated,
  currentDocVerUpdated,
  dragPagesStarted,
  dragNodesStarted,
  dragEnded,
  lastHomeUpdated,
  lastInboxUpdated,
  viewerPageHaveChangedDialogVisibilityChanged
} = uiSlice.actions
export default uiSlice.reducer

export const selectNavBarCollapsed = (state: RootState) =>
  state.ui.navbar.collapsed
export const selectNavBarWidth = (state: RootState) => state.ui.navbar.width

export const selectCurrentSharedNodeID = (state: RootState) => {
  return state.ui.currentSharedNode?.id
}

export const selectSharedNode = (state: RootState, nodeID: string) => {
  return state.sharedNodes.entities[nodeID]
}

export const selectCurrentSharedRootID = (state: RootState) => {
  return state.ui.currentSharedRootID
}

export const selectPanelComponent = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainPanelComponent
  }

  return state.ui.secondaryPanelComponent
}

export const selectOtherPanelComponent = (
  state: RootState,
  mode: PanelMode
) => {
  /* select other panel (as opposite to current one)
  if mode == "main" => selects "secondary" panel component
  if mode == "secondary" => select "main" panel component
  */
  if (mode == "main") {
    return state.ui.secondaryPanelComponent
  }

  return state.ui.mainPanelComponent
}

export const selectCurrentDocVerID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewerCurrentDocVerID
  }

  return state.ui.secondaryViewerCurrentDocVerID
}

export const selectCurrentDocVer = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    if (state.ui.mainViewerCurrentDocVerID) {
      return state.docVers.entities[state.ui.mainViewerCurrentDocVerID]
    }
  }

  if (state.ui.secondaryViewerCurrentDocVerID) {
    return state.docVers.entities[state.ui.secondaryViewerCurrentDocVerID]
  }
}

export const selectDraggedPages = (state: RootState) =>
  state.ui.dragndrop?.pages

export const selectDraggedPagesDocID = (state: RootState) =>
  state.ui.dragndrop?.pagesDocID

export const selectDraggedPagesDocParentID = (state: RootState) =>
  state.ui.dragndrop?.pagesDocParentID

export const selectDraggedNodeIDs = (state: RootState) =>
  state.ui.dragndrop?.nodeIDs

export const selectDraggedNodes = createSelector(
  /** Input selectors */
  [(state: RootState) => state.nodes.entities, selectDraggedNodeIDs],
  (
    entities: Record<string, NodeType>,
    draggedNodeIDs: string[] | undefined | null
  ) => {
    /** Returns `NodeType` objects of the nodes
     * currently being dragged */
    return Object.values(entities).filter((n: NodeType) =>
      draggedNodeIDs?.includes(n.id)
    )
  }
)

export const selectDraggedNodesSourceFolderID = (state: RootState) => {
  return state.ui.dragndrop?.sourceFolderID
}

export const selectDocumentCurrentPage = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.ui.mainViewerCurrentPageNumber
  }

  return state.ui.secondaryViewerCurrentPageNumber
}

export const selectLastHome = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderLastHome
  }

  return state.ui.secondaryCommanderLastHome
}

export const selectLastInbox = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderLastInbox
  }

  return state.ui.secondaryCommanderLastInbox
}

export const selectViewerPagesHaveChangedDialogVisibility = (
  state: RootState
) => {
  return state.ui.viewerPageHaveChangedDialogVisibility || "closed"
}

/* Load initial collapse state value from cookie */
function initial_collapse_value(): boolean {
  const collapsed = Cookies.get(NAVBAR_COLLAPSED_COOKIE) as BooleanString

  if (collapsed == "true") {
    return true
  }

  return false
}

/* Load initial width value from cookie */
function initial_width_value(): number {
  const width = Cookies.get(NAVBAR_WIDTH_COOKIE)

  if (width) {
    const ret = parseInt(width)
    if (ret > 0) {
      return ret
    } else {
      return FULL_WIDTH
    }
  }

  return FULL_WIDTH
}
