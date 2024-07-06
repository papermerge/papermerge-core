import {createSlice} from "@reduxjs/toolkit"
import {RootState} from "@/app/types"

const COLLAPSED_WIDTH = 55
const FULL_WIDTH = 160

interface NavBar {
  collapsed: boolean
  width: number
}

const initialState: NavBar = {
  collapsed: false,
  width: FULL_WIDTH
}

const navBarSlice = createSlice({
  name: "navbar",
  initialState,
  reducers: {
    toggleNavBar(state) {
      if (state.collapsed) {
        state.collapsed = false
        state.width = FULL_WIDTH
      } else {
        state.collapsed = true
        state.width = COLLAPSED_WIDTH
      }
    }
  }
})

export default navBarSlice.reducer

export const {toggleNavBar} = navBarSlice.actions

export const selectNavBarCollapsed = (state: RootState) =>
  state.navBar.collapsed
export const selectNavBarWidth = (state: RootState) => state.navBar.width
