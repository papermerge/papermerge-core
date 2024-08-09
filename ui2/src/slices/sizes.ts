import {PanelMode} from "@/types"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"
import {RootState} from "@/app/types"

const SMALL_BOTTOM_MARGIN = 3 /* pixles */

type SearchPanelSizes = {
  actionPanelHeight: number
}

// i.e Commander's panel, viewer's panel
type PanelSizes = {
  actionPanelHeight: number
  breadcrumbHeight: number
}

type Sizes = {
  outletTopMarginAndPadding: number
  windowInnerHeight: number
  main: PanelSizes
  secondary?: PanelSizes
  search?: SearchPanelSizes
}

type DualArg = {
  mode: PanelMode
  value: number
}

const initialState: Sizes = {
  outletTopMarginAndPadding: 0,
  windowInnerHeight: window.innerHeight,
  main: {
    actionPanelHeight: 0,
    breadcrumbHeight: 0
  }
}

const sizesSlice = createSlice({
  name: "sizes",
  initialState,
  reducers: {
    updateOutlet(state, action: PayloadAction<number>) {
      state.windowInnerHeight = window.innerHeight
      state.outletTopMarginAndPadding = action.payload
    },
    updateActionPanel(state, action: PayloadAction<DualArg>) {
      const {value, mode} = action.payload

      state.windowInnerHeight = window.innerHeight
      if (mode == "main") {
        // main panel
        state.main.actionPanelHeight = value
      } else if (mode == "secondary") {
        // secondary panel
        if (state.secondary) {
          state.secondary.actionPanelHeight = value
        } else {
          state.secondary = {
            breadcrumbHeight: 0,
            actionPanelHeight: value
          }
        }
      }
    },
    updateBreadcrumb(state, action: PayloadAction<DualArg>) {
      const {value, mode} = action.payload

      state.windowInnerHeight = window.innerHeight
      if (mode == "main") {
        // main panel
        state.main.breadcrumbHeight = value
      } else if (mode == "secondary") {
        // secondary panel
        if (state.secondary) {
          state.secondary.breadcrumbHeight = value
        } else {
          state.secondary = {
            breadcrumbHeight: value,
            actionPanelHeight: 0
          }
        }
      }
    },
    updateSearchActionPanel(state, action: PayloadAction<number>) {
      state.windowInnerHeight = window.innerHeight
      if (state.search) {
        state.search.actionPanelHeight = action.payload
      } else {
        state.search = {
          actionPanelHeight: action.payload
        }
      }
    }
  }
})

export default sizesSlice.reducer

export const {
  updateOutlet,
  updateActionPanel,
  updateSearchActionPanel,
  updateBreadcrumb
} = sizesSlice.actions

export const selectContentHeight = (state: RootState, mode: PanelMode) => {
  let height: number = state.sizes.windowInnerHeight

  height -= state.sizes.outletTopMarginAndPadding

  if (mode == "main") {
    height -= state.sizes.main.actionPanelHeight
    height -= state.sizes.main.breadcrumbHeight
  } else if (mode == "secondary") {
    if (state.sizes.secondary) {
      height -= state.sizes.secondary.actionPanelHeight
      height -= state.sizes.secondary.breadcrumbHeight
    }
  }

  /* Let there be a small margin at the bottom of the viewport */
  height -= SMALL_BOTTOM_MARGIN

  return height
}

export const selectSearchContentHeight = (state: RootState) => {
  let height: number = state.sizes.windowInnerHeight

  height -= state.sizes.outletTopMarginAndPadding

  if (state.sizes.search) {
    height -= state.sizes.search.actionPanelHeight
  }

  /* Let there be a small margin at the bottom of the viewport */
  height -= SMALL_BOTTOM_MARGIN

  return height
}
