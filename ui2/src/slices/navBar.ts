import {createSlice} from "@reduxjs/toolkit"
import Cookies from "js-cookie"
import {RootState} from "@/app/types"
import type {NavBarCollapsedCookieStrings} from "@/types"

const COLLAPSED_WIDTH = 55
const FULL_WIDTH = 160
const NAVBAR_COLLAPSED_COOKIE = "navbar_collapsed"
const NAVBAR_WIDTH_COOKIE = "navbar_width"

interface NavBar {
  collapsed: boolean
  width: number
}

const initialState: NavBar = {
  collapsed: initial_collapse_value(),
  width: initial_width_value()
}

const navBarSlice = createSlice({
  name: "navbar",
  initialState,
  reducers: {
    toggleNavBar(state) {
      if (state.collapsed) {
        state.collapsed = false
        state.width = FULL_WIDTH
        Cookies.set(NAVBAR_COLLAPSED_COOKIE, "false")
        Cookies.set(NAVBAR_WIDTH_COOKIE, `${FULL_WIDTH}`)
      } else {
        state.collapsed = true
        state.width = COLLAPSED_WIDTH
        Cookies.set(NAVBAR_COLLAPSED_COOKIE, "true")
        Cookies.set(NAVBAR_WIDTH_COOKIE, `${COLLAPSED_WIDTH}`)
      }
    }
  }
})

/* Load initial collapse state value from cookie */
function initial_collapse_value(): boolean {
  const collapsed = Cookies.get(
    NAVBAR_COLLAPSED_COOKIE
  ) as NavBarCollapsedCookieStrings

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

export default navBarSlice.reducer

export const {toggleNavBar} = navBarSlice.actions

export const selectNavBarCollapsed = (state: RootState) =>
  state.navBar.collapsed
export const selectNavBarWidth = (state: RootState) => state.navBar.width
