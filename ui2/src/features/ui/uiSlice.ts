import Cookies from "js-cookie"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import type {RootState} from "@/app/types"
import type {BooleanString} from "@/types"

import type {FolderType, FileItemType, FileItemStatus, NodeType} from "@/types"

const COLLAPSED_WIDTH = 55
const FULL_WIDTH = 160
const NAVBAR_COLLAPSED_COOKIE = "navbar_collapsed"
const NAVBAR_WIDTH_COOKIE = "navbar_width"

type UpdateFileStatusArg = {
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

interface UIState {
  uploader: UploaderState
  navbar: NavBarState
}

const initialState: UIState = {
  uploader: {
    opened: false,
    files: []
  },
  navbar: {
    collapsed: initial_collapse_value(),
    width: initial_width_value()
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
    openUploader: state => {
      state.uploader.opened = true
    },
    updateFileItem: (state, action: PayloadAction<UpdateFileStatusArg>) => {
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
    }
  }
})
export const {openUploader, closeUploader, updateFileItem, toggleNavBar} =
  uiSlice.actions
export default uiSlice.reducer

export const selectOpened = (state: RootState): boolean => state.uploader.opened

export const selectFiles = (state: RootState): Array<FileItemType> =>
  state.uploader.files

export const selectNavBarCollapsed = (state: RootState) =>
  state.ui.navbar.collapsed
export const selectNavBarWidth = (state: RootState) => state.ui.navbar.width

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
