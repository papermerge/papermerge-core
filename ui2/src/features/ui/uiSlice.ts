import type {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {BooleanString, CType, ClientPage, PanelMode} from "@/types"
import {PayloadAction, createSelector, createSlice} from "@reduxjs/toolkit"
import Cookies from "js-cookie"

import {
  MAX_ZOOM_FACTOR,
  MIN_ZOOM_FACTOR,
  ZOOM_FACTOR_INIT,
  ZOOM_FACTOR_STEP
} from "@/cconstants"

import type {FileItemStatus, FileItemType, FolderType, NodeType} from "@/types"

const COLLAPSED_WIDTH = 55
const FULL_WIDTH = 160
const NAVBAR_COLLAPSED_COOKIE = "navbar_collapsed"
const NAVBAR_WIDTH_COOKIE = "navbar_width"
const MAIN_THUMBNAILS_PANEL_OPENED_COOKIE = "main_thumbnails_panel_opened"
const SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE =
  "secondary_thumbnails_panel_opened"

const SMALL_BOTTOM_MARGIN = 13 /* pixles */

type DualArg = {
  mode: PanelMode
  value: number
}

type UpdateFilterType = {
  mode: PanelMode
  filter?: string
}

type LastPageSizeArg = {
  mode: PanelMode
  pageSize: number
}

type CurrentDocVerUpdateArg = {
  mode: PanelMode
  docVerID: string | undefined
}

interface PanelSelectionArg {
  itemID: string
  mode: PanelMode
}

export interface UploaderFileItemArgs {
  item: {
    source: NodeType | null
    target: FolderType
    file_name: string
  }
  status: FileItemStatus
  error: string | null
}

interface NavBarState {
  collapsed: boolean
  width: number
}

interface UploaderState {
  opened: boolean
  files: Array<FileItemType>
}

interface SearchPanelSizes {
  actionPanelHeight: number
}

// i.e Commander's panel, viewer's panel
interface PanelSizes {
  actionPanelHeight: number
  breadcrumbHeight: number
}

interface SizesState {
  outletTopMarginAndPadding: number
  windowInnerHeight: number
  main: PanelSizes
  secondary?: PanelSizes
  search?: SearchPanelSizes
}

interface CurrentNodeArgs {
  id: string
  ctype: CType
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
}

type PanelComponent = "commander" | "viewer" | "searchResults"

interface UIState {
  uploader: UploaderState
  navbar: NavBarState
  sizes: SizesState
  dragndrop?: DragNDropState
  currentNodeMain?: CurrentNode
  currentNodeSecondary?: CurrentNode
  mainViewer?: ViewerState
  secondaryViewer?: ViewerState
  mainCommanderSelectedIDs?: Array<string>
  mainCommanderFilter?: string
  mainCommanderLastPageSize?: number
  secondaryCommanderSelectedIDs?: Array<String>
  secondaryCommanderFilter?: string
  secondaryCommanderLastPageSize?: number
  mainPanelComponent?: PanelComponent
  secondaryPanelComponent?: PanelComponent
  mainViewerThumbnailsPanelOpen?: boolean
  // zoom factor is expressed as percentage.
  // 5 -> means 5%
  // 100 -> means 100% i.e exact fit
  mainViewerZoomFactor?: number
  mainViewerSelectedIDs?: Array<string>
  mainViewerCurrentDocVerID?: string
  secondaryViewerThumbnailsPanelOpen?: boolean
  secondaryViewerZoomFactor?: number
  secondaryViewerSelectedIDs?: Array<string>
  secondaryViewerCurrentDocVerID?: string
}

const initialState: UIState = {
  uploader: {
    opened: false,
    files: []
  },
  navbar: {
    collapsed: initial_collapse_value(),
    width: initial_width_value()
  },
  sizes: {
    outletTopMarginAndPadding: 0,
    windowInnerHeight: window.innerHeight,
    main: {
      actionPanelHeight: 0,
      breadcrumbHeight: 0
    }
  },
  mainViewerThumbnailsPanelOpen: mainThumbnailsPanelInitialState(),
  secondaryViewerThumbnailsPanelOpen: secondaryThumbnailsPanelInitialState()
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    closeUploader: state => {
      state.uploader.opened = false
      state.uploader.files = []
    },
    uploaderFileItemUpdated: (
      state,
      action: PayloadAction<UploaderFileItemArgs>
    ) => {
      const file_name = action.payload.item.file_name
      const target_id = action.payload.item.target.id
      const itemToAdd = {
        status: action.payload.status,
        error: action.payload.error,
        file_name: action.payload.item.file_name,
        source: action.payload.item.source,
        target: action.payload.item.target
      }

      const found = state.uploader.files.find(
        i => i.file_name == file_name && i.target.id == target_id
      )

      if (!found) {
        state.uploader.files.push(itemToAdd)
        state.uploader.opened = true
        return
      }

      const newItems = state.uploader.files.map(i => {
        if (i.file_name == file_name && i.target.id == target_id) {
          return itemToAdd
        } else {
          return i
        }
      })

      state.uploader.files = newItems
      state.uploader.opened = true
    }, // end of uploaderFileItemUpdated
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
    updateOutlet(state, action: PayloadAction<number>) {
      state.sizes.windowInnerHeight = window.innerHeight
      state.sizes.outletTopMarginAndPadding = action.payload
    },
    updateActionPanel(state, action: PayloadAction<DualArg>) {
      const {value, mode} = action.payload

      state.sizes.windowInnerHeight = window.innerHeight
      if (mode == "main") {
        // main panel
        state.sizes.main.actionPanelHeight = value
      } else if (mode == "secondary") {
        // secondary panel
        if (state.sizes.secondary) {
          state.sizes.secondary.actionPanelHeight = value
        } else {
          state.sizes.secondary = {
            breadcrumbHeight: 0,
            actionPanelHeight: value
          }
        }
      }
    },
    updateBreadcrumb(state, action: PayloadAction<DualArg>) {
      const {value, mode} = action.payload

      state.sizes.windowInnerHeight = window.innerHeight
      if (mode == "main") {
        // main panel
        state.sizes.main.breadcrumbHeight = value
      } else if (mode == "secondary") {
        // secondary panel
        if (state.sizes.secondary) {
          state.sizes.secondary.breadcrumbHeight = value
        } else {
          state.sizes.secondary = {
            breadcrumbHeight: value,
            actionPanelHeight: 0
          }
        }
      }
    },
    updateSearchActionPanel(state, action: PayloadAction<number>) {
      state.sizes.windowInnerHeight = window.innerHeight
      if (state.sizes.search) {
        state.sizes.search.actionPanelHeight = action.payload
      } else {
        state.sizes.search = {
          actionPanelHeight: action.payload
        }
      }
    },
    currentNodeChanged(state, action: PayloadAction<CurrentNodeArgs>) {
      const payload = action.payload
      if (payload.panel == "main") {
        state.currentNodeMain = {
          id: payload.id,
          ctype: payload.ctype
        }
        if (payload.ctype == "folder") {
          state.mainPanelComponent = "commander"
        }
        if (payload.ctype == "document") {
          state.mainPanelComponent = "viewer"
        }
        state.mainCommanderSelectedIDs = []
        return
      }

      // mode == secondary
      state.currentNodeSecondary = {
        id: payload.id,
        ctype: payload.ctype
      }
      if (payload.ctype == "folder") {
        state.secondaryPanelComponent = "commander"
      }
      if (payload.ctype == "document") {
        state.secondaryPanelComponent = "viewer"
      }
      state.secondaryCommanderSelectedIDs = []
    }, // end of currentNodeChanged
    //------------------------------------------------------------------
    secondaryPanelOpened(state, action: PayloadAction<PanelComponent>) {
      state.secondaryPanelComponent = action.payload
    },

    secondaryPanelClosed(state) {
      state.secondaryPanelComponent = undefined
    },

    commanderSelectionNodeAdded(
      state,
      action: PayloadAction<PanelSelectionArg>
    ) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainCommanderSelectedIDs) {
          state.mainCommanderSelectedIDs.push(itemID)
        } else {
          state.mainCommanderSelectedIDs = [itemID]
        }
        return
      }

      // mode == secondary
      if (state.secondaryCommanderSelectedIDs) {
        state.secondaryCommanderSelectedIDs.push(itemID)
      } else {
        state.secondaryCommanderSelectedIDs = [itemID]
      }
    }, // end of commanderSelectionNodeAdded
    //------------------------------------------------------------------
    commanderSelectionNodeRemoved(
      state,
      action: PayloadAction<PanelSelectionArg>
    ) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainCommanderSelectedIDs) {
          const newValues = state.mainCommanderSelectedIDs.filter(
            i => i != itemID
          )
          state.mainCommanderSelectedIDs = newValues
        }

        return
      }
      // secondary
      if (state.secondaryCommanderSelectedIDs) {
        const newValues = state.secondaryCommanderSelectedIDs.filter(
          i => i != itemID
        )
        state.secondaryCommanderSelectedIDs = newValues
      }
    }, // commanderSelectionNodeRemoved
    //------------------------------------------------------------------
    commanderSelectionCleared(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        state.mainCommanderSelectedIDs = []
        return
      }
      // secondary
      state.secondaryCommanderSelectedIDs = []
    }, // end of commanderSelectionCleared
    //-------------------------------------------
    filterUpdated: (state, action: PayloadAction<UpdateFilterType>) => {
      const {mode, filter} = action.payload
      if (mode == "main") {
        state.mainCommanderFilter = filter
        return
      }

      state.secondaryCommanderFilter = filter
    },
    commanderLastPageSizeUpdated(
      state,
      action: PayloadAction<LastPageSizeArg>
    ) {
      const {mode, pageSize} = action.payload
      if (mode == "main") {
        state.mainCommanderLastPageSize = pageSize
        return
      }

      state.secondaryCommanderLastPageSize = pageSize
    },
    viewerThumbnailsPanelToggled(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        const new_value = !Boolean(state.mainViewerThumbnailsPanelOpen)
        state.mainViewerThumbnailsPanelOpen = new_value
        if (new_value) {
          Cookies.set(MAIN_THUMBNAILS_PANEL_OPENED_COOKIE, "true")
        } else {
          Cookies.set(MAIN_THUMBNAILS_PANEL_OPENED_COOKIE, "false")
        }
        return
      }
      const new_value = !Boolean(state.secondaryViewerThumbnailsPanelOpen)
      state.secondaryViewerThumbnailsPanelOpen = new_value
      if (new_value) {
        Cookies.set(SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE, "true")
      } else {
        Cookies.set(SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE, "false")
      }
    },
    zoomFactorIncremented(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        const zoom = state.mainViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom + ZOOM_FACTOR_STEP < MAX_ZOOM_FACTOR) {
          state.mainViewerZoomFactor = zoom + ZOOM_FACTOR_STEP
        }
      }
      if (mode == "secondary") {
        const zoom = state.secondaryViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom + ZOOM_FACTOR_STEP < MAX_ZOOM_FACTOR) {
          state.secondaryViewerZoomFactor = zoom + ZOOM_FACTOR_STEP
        }
      }
    },
    zoomFactorDecremented(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        let zoom = state.mainViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom - ZOOM_FACTOR_STEP > MIN_ZOOM_FACTOR) {
          state.mainViewerZoomFactor = zoom - ZOOM_FACTOR_STEP
        }
      }
      if (mode == "secondary") {
        let zoom = state.secondaryViewerZoomFactor || ZOOM_FACTOR_INIT
        if (zoom && zoom - ZOOM_FACTOR_STEP > MIN_ZOOM_FACTOR) {
          state.secondaryViewerZoomFactor = zoom - ZOOM_FACTOR_STEP
        }
      }
    },
    zoomFactorReseted(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload
      if (mode == "main") {
        state.mainViewerZoomFactor = ZOOM_FACTOR_INIT
      }
      if (mode == "secondary") {
        state.secondaryViewerZoomFactor = ZOOM_FACTOR_INIT
      }
    },
    viewerSelectionPageAdded(state, action: PayloadAction<PanelSelectionArg>) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainViewerSelectedIDs) {
          state.mainViewerSelectedIDs.push(itemID)
        } else {
          state.mainViewerSelectedIDs = [itemID]
        }
        return
      }

      // mode == secondary
      if (state.secondaryViewerSelectedIDs) {
        state.secondaryViewerSelectedIDs.push(itemID)
      } else {
        state.secondaryViewerSelectedIDs = [itemID]
      }
    },
    viewerSelectionPageRemoved(
      state,
      action: PayloadAction<PanelSelectionArg>
    ) {
      const mode = action.payload.mode
      const itemID = action.payload.itemID
      if (mode == "main") {
        if (state.mainViewerSelectedIDs) {
          const newValues = state.mainViewerSelectedIDs.filter(i => i != itemID)
          state.mainViewerSelectedIDs = newValues
        }

        return
      }
      // secondary
      if (state.secondaryViewerSelectedIDs) {
        const newValues = state.secondaryViewerSelectedIDs.filter(
          i => i != itemID
        )
        state.secondaryViewerSelectedIDs = newValues
      }
    },
    viewerSelectionCleared(state, action: PayloadAction<PanelMode>) {
      const mode = action.payload

      if (mode == "main") {
        state.mainViewerSelectedIDs = []
        return
      }
      // secondary
      state.secondaryViewerSelectedIDs = []
    },
    currentDocVerUpdated(state, action: PayloadAction<CurrentDocVerUpdateArg>) {
      const {mode, docVerID} = action.payload
      if (mode == "main") {
        state.mainViewerCurrentDocVerID = docVerID
      } else {
        state.secondaryViewerCurrentDocVerID = docVerID
      }
    },
    dragPagesStarted(state, action: PayloadAction<Array<ClientPage>>) {
      if (state.dragndrop) {
        state.dragndrop.pages = action.payload
      } else {
        state.dragndrop = {
          pages: action.payload
        }
      }
    },
    dragPagesEnded(state) {
      if (state.dragndrop) {
        state.dragndrop.pages = []
      }
    }
  }
})

export const {
  closeUploader,
  uploaderFileItemUpdated,
  toggleNavBar,
  updateOutlet,
  updateActionPanel,
  updateSearchActionPanel,
  updateBreadcrumb,
  currentNodeChanged,
  secondaryPanelClosed,
  secondaryPanelOpened,
  commanderSelectionNodeAdded,
  commanderSelectionNodeRemoved,
  commanderSelectionCleared,
  filterUpdated,
  commanderLastPageSizeUpdated,
  viewerThumbnailsPanelToggled,
  zoomFactorIncremented,
  zoomFactorDecremented,
  zoomFactorReseted,
  viewerSelectionPageAdded,
  viewerSelectionPageRemoved,
  viewerSelectionCleared,
  currentDocVerUpdated,
  dragPagesStarted,
  dragPagesEnded
} = uiSlice.actions
export default uiSlice.reducer

export const selectOpened = (state: RootState): boolean =>
  state.ui.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.ui.uploader.files

export const selectNavBarCollapsed = (state: RootState) =>
  state.ui.navbar.collapsed
export const selectNavBarWidth = (state: RootState) => state.ui.navbar.width

export const selectContentHeight = (state: RootState, mode: PanelMode) => {
  let height: number = state.ui.sizes.windowInnerHeight

  height -= state.ui.sizes.outletTopMarginAndPadding

  if (mode == "main") {
    height -= state.ui.sizes.main.actionPanelHeight
    height -= state.ui.sizes.main.breadcrumbHeight
  } else if (mode == "secondary") {
    if (state.ui.sizes.secondary) {
      height -= state.ui.sizes.secondary.actionPanelHeight
      height -= state.ui.sizes.secondary.breadcrumbHeight
    }
  }

  /* Let there be a small margin at the bottom of the viewport */
  height -= SMALL_BOTTOM_MARGIN
  return height
}

export const selectSearchContentHeight = (state: RootState) => {
  let height: number = state.ui.sizes.windowInnerHeight

  height -= state.ui.sizes.outletTopMarginAndPadding

  if (state.ui.sizes.search) {
    height -= state.ui.sizes.search.actionPanelHeight
  }

  /* Let there be a small margin at the bottom of the viewport */
  height -= SMALL_BOTTOM_MARGIN

  return height
}

export const selectCurrentNodeID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.currentNodeMain?.id
  }

  return state.ui.currentNodeSecondary?.id
}

export const selectCurrentNodeCType = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.currentNodeMain?.ctype
  }

  return state.ui.currentNodeSecondary?.ctype
}

export const selectPanelComponent = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainPanelComponent
  }

  return state.ui.secondaryPanelComponent
}

export const selectSelectedNodeIds = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderSelectedIDs || []
  }

  return state.ui.secondaryCommanderSelectedIDs || []
}

export const selectSelectedNodesCount = createSelector(
  selectSelectedNodeIds,
  selectedIds => {
    if (!selectedIds) {
      return 0
    }

    return selectedIds.length
  }
)

export const selectFilterText = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainCommanderFilter
  }

  return state.ui.secondaryCommanderFilter
}

export const selectThumbnailsPanelOpen = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return Boolean(state.ui.mainViewerThumbnailsPanelOpen)
  }

  return Boolean(state.ui.secondaryViewerThumbnailsPanelOpen)
}

export const selectLastPageSize = (
  state: RootState,
  mode: PanelMode
): number => {
  if (mode == "main") {
    return (
      state.ui.mainCommanderLastPageSize || PAGINATION_DEFAULT_ITEMS_PER_PAGES
    )
  }

  return (
    state.ui.secondaryCommanderLastPageSize ||
    PAGINATION_DEFAULT_ITEMS_PER_PAGES
  )
}

export const selectZoomFactor = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewerZoomFactor || ZOOM_FACTOR_INIT
  }

  return state.ui.secondaryViewerZoomFactor || ZOOM_FACTOR_INIT
}

export const selectCurrentDocVerID = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewerCurrentDocVerID
  }

  return state.ui.secondaryViewerCurrentDocVerID
}

export const selectDraggedPages = (state: RootState) =>
  state.ui.dragndrop?.pages

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

function mainThumbnailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    MAIN_THUMBNAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}

function secondaryThumbnailsPanelInitialState(): boolean {
  const is_opened = Cookies.get(
    SECONDARY_THUMBNAILS_PANEL_OPENED_COOKIE
  ) as BooleanString

  if (is_opened == "true") {
    return true
  }

  return false
}
