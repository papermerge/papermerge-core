import {configureStore} from "@reduxjs/toolkit"
import {apiSlice} from "@/features/api/slice"
import authSliceReducer from "@/features/auth/slice"
import currentUserReducer from "@/slices/currentUser"
import dualPanelReducer from "@/slices/dualPanel/dualPanel"
import tagsReducer from "@/features/tags/tagsSlice"
import groupsReducer from "@/features/groups/groupsSlice"
import usersReducer from "@/features/users/usersSlice"
import nodesReducer from "@/features/nodes/nodesSlice"
import uiReducer from "@/features/ui/uiSlice"
import {uploaderReducer} from "@/slices/uploader"
import sizesSliceReducer from "@/slices/sizes"
import dragndropReducer from "@/slices/dragndrop"

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    currentUser: currentUserReducer,
    dualPanel: dualPanelReducer,
    tags: tagsReducer,
    groups: groupsReducer,
    users: usersReducer,
    uploader: uploaderReducer,
    sizes: sizesSliceReducer,
    dragndrop: dragndropReducer,
    nodes: nodesReducer,
    ui: uiReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(apiSlice.middleware)
})
