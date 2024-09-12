import {apiSlice} from "@/features/api/slice"
import authSliceReducer from "@/features/auth/slice"
import docVersReducer from "@/features/documentVers/documentVersSlice"
import groupsReducer from "@/features/groups/groupsSlice"
import nodesReducer from "@/features/nodes/nodesSlice"
import pagesReducer from "@/features/pages/pagesSlice"
import tagsReducer from "@/features/tags/tagsSlice"
import uiReducer from "@/features/ui/uiSlice"
import usersReducer from "@/features/users/usersSlice"
import currentUserReducer from "@/slices/currentUser"
import dualPanelReducer from "@/slices/dualPanel/dualPanel"
import {configureStore} from "@reduxjs/toolkit"

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    currentUser: currentUserReducer,
    dualPanel: dualPanelReducer,
    tags: tagsReducer,
    groups: groupsReducer,
    users: usersReducer,
    nodes: nodesReducer,
    pages: pagesReducer,
    ui: uiReducer,
    docVers: docVersReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(apiSlice.middleware)
})
