import {apiSlice} from "@/features/api/slice"
import authSliceReducer from "@/features/auth/slice"
import customFieldsReducer from "@/features/custom-fields/customFieldsSlice"
import documentTypesReducer from "@/features/document-types/documentTypesSlice"
import docVersReducer from "@/features/document/documentVersSlice"
import imageObjects from "@/features/document/imageObjectsSlice"
import pagesReducer from "@/features/document/pagesSlice"
import groupsReducer from "@/features/groups/groupsSlice"
import nodesReducer from "@/features/nodes/nodesSlice"
import rolesReducer from "@/features/roles/rolesSlice"
import searchReducer from "@/features/search/searchSlice"
import sharedNodesReducer from "@/features/shared_nodes/sharedNodesSlice"
import tagsReducer from "@/features/tags/tagsSlice"
import uiReducer from "@/features/ui/uiSlice"
import usersReducer from "@/features/users/usersSlice"
import currentUserReducer from "@/slices/currentUser"
import {configureStore} from "@reduxjs/toolkit"
import {listenerMiddleware} from "./listenerMiddleware"

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    currentUser: currentUserReducer,
    tags: tagsReducer,
    groups: groupsReducer,
    roles: rolesReducer,
    customFields: customFieldsReducer,
    documentTypes: documentTypesReducer,
    users: usersReducer,
    nodes: nodesReducer,
    sharedNodes: sharedNodesReducer,
    search: searchReducer,
    pages: pagesReducer,
    imageObjects: imageObjects,
    ui: uiReducer,
    docVers: docVersReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(apiSlice.middleware)
})
