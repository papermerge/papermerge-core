import {configureStore} from "@reduxjs/toolkit"
import currentUserReducer from "@/slices/currentUser"
import dualPanelReducer from "@/slices/dualPanel/dualPanel"
import navBarReducer from "@/slices/navBar"
import tagsReducer from "@/slices/tags"
import groupsReducer from "@/slices/groups"
import usersReducer from "@/slices/users"
import tagDetailsReducer from "@/slices/tagDetails"
import groupDetailsReducer from "@/slices/groupDetails"
import userDetailsReducer from "@/slices/userDetails"
import {uploaderReducer} from "@/slices/uploader"
import sizesSliceReducer from "@/slices/sizes"

export const store = configureStore({
  reducer: {
    currentUser: currentUserReducer,
    dualPanel: dualPanelReducer,
    navBar: navBarReducer,
    tags: tagsReducer,
    groups: groupsReducer,
    users: usersReducer,
    tagDetails: tagDetailsReducer,
    groupDetails: groupDetailsReducer,
    userDetails: userDetailsReducer,
    uploader: uploaderReducer,
    sizes: sizesSliceReducer
  }
})
