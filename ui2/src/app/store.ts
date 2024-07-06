import {configureStore} from "@reduxjs/toolkit"
import currentUserReducer from "@/slices/currentUser"
import dualPanelReducer from "@/slices/dualPanel"
import navBarReducer from "@/slices/navBar"
import groupsReducer from "@/slices/groups"
import tagsReducer from "@/slices/tags"
import groupDetailsReducer from "@/slices/groupDetails"
import usersReducer from "@/slices/users"
import userDetailsReducer from "@/slices/userDetails"

export const store = configureStore({
  reducer: {
    currentUser: currentUserReducer,
    dualPanel: dualPanelReducer,
    navBar: navBarReducer,
    groups: groupsReducer,
    groupDetails: groupDetailsReducer,
    users: usersReducer,
    userDetails: userDetailsReducer,
    tags: tagsReducer
  }
})
