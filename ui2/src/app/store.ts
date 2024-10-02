import {apiSlice} from "@/features/api/slice"
import authSliceReducer from "@/features/auth/slice"
import customFieldsReducer from "@/features/custom-fields/customFieldsSlice"
import documentTypesReducer from "@/features/document-types/documentTypesSlice"
import docVersReducer from "@/features/document/documentVersSlice"
import pagesReducer from "@/features/document/pagesSlice"
import groupsReducer from "@/features/groups/groupsSlice"
import nodesReducer from "@/features/nodes/nodesSlice"
import searchReducer from "@/features/search/searchSlice"
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
    customFields: customFieldsReducer,
    documentTypes: documentTypesReducer,
    users: usersReducer,
    nodes: nodesReducer,
    search: searchReducer,
    pages: pagesReducer,
    ui: uiReducer,
    docVers: docVersReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .concat(apiSlice.middleware)
})
