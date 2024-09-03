import {configureStore} from "@reduxjs/toolkit"
import {apiSlice} from "@/features/api/slice"
import authSliceReducer from "@/features/auth/slice"
import currentUserReducer from "@/slices/currentUser"
import dualPanelReducer from "@/slices/dualPanel/dualPanel"
import navBarReducer from "@/slices/navBar"
import tagsReducer from "@/slices/tags"
import groupsReducer from "@/features/groups/groupsSlice"
import usersReducer from "@/features/users/slice"
import tagDetailsReducer from "@/slices/tagDetails"
import {uploaderReducer} from "@/slices/uploader"
import sizesSliceReducer from "@/slices/sizes"
import dragndropReducer from "@/slices/dragndrop"

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    currentUser: currentUserReducer,
    dualPanel: dualPanelReducer,
    navBar: navBarReducer,
    tags: tagsReducer,
    groups: groupsReducer,
    users: usersReducer,
    tagDetails: tagDetailsReducer,
    uploader: uploaderReducer,
    sizes: sizesSliceReducer,
    dragndrop: dragndropReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(apiSlice.middleware)
})
