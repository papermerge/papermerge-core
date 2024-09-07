import Cookies from "js-cookie"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import type {RootState} from "@/app/types"
import type {BooleanString, PanelMode} from "@/types"

import type {FolderType, FileItemType, FileItemStatus, NodeType} from "@/types"

const COLLAPSED_WIDTH = 55
const FULL_WIDTH = 160
const NAVBAR_COLLAPSED_COOKIE = "navbar_collapsed"
const NAVBAR_WIDTH_COOKIE = "navbar_width"

const SMALL_BOTTOM_MARGIN = 13 /* pixles */

type DualArg = {
  mode: PanelMode
  value: number
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

interface UIState {
  uploader: UploaderState
  navbar: NavBarState
  sizes: SizesState
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
  }
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
    },
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
  updateBreadcrumb
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
