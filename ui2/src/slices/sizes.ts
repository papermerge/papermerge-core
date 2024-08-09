import {PanelMode} from "@/types"
import {createSlice, PayloadAction} from "@reduxjs/toolkit"

// i.e Commander's panel, viewer's panel
type PanelSizes = {
  actionPanelHeight: number
  breadcrumbHeight: number
  pagination: number
}

type Sizes = {
  outletTopMarginAndPadding: number
  main: PanelSizes
  secondary?: PanelSizes
}

type DualArg = {
  mode: PanelMode
  value: number
}

const initialState: Sizes = {
  outletTopMarginAndPadding: 0,
  main: {
    actionPanelHeight: 0,
    breadcrumbHeight: 0,
    pagination: 0
  }
}

const sizesSlice = createSlice({
  name: "sizes",
  initialState,
  reducers: {
    updateOutlet(state, action: PayloadAction<number>) {
      state.outletTopMarginAndPadding = action.payload
    },
    updateActionPanel(state) {},
    updateBreadcrumb(state, action: PayloadAction<DualArg>) {
      const {value, mode} = action.payload

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
            pagination: 0,
            actionPanelHeight: 0
          }
        }
      }
    },
    updatePagination(state) {}
  }
})

export default sizesSlice.reducer

export const {
  updateOutlet,
  updateActionPanel,
  updateBreadcrumb,
  updatePagination
} = sizesSlice.actions
