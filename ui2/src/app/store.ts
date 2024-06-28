import {configureStore} from "@reduxjs/toolkit"
import currentUserReducer from "@/slices/currentUser"
import dualPanelReducer from "@/slices/dualPanel"
import navBarReducer from "@/slices/navBar"
import groupsReducer from "@/slices/groups"

export const store = configureStore({
  reducer: {
    currentUser: currentUserReducer,
    dualPanel: dualPanelReducer,
    navBar: navBarReducer,
    groups: groupsReducer
  }
})
