import {apiSlice} from "@/features/api/slice"
import auditLogsReducer from "@/features/audit/storage/audit"
import authSliceReducer from "@/features/auth/slice"
import customFieldsReducer from "@/features/custom-fields/storage/custom_field"
import documentTypesReducer from "@/features/document-types/storage/documentType"
import {docsListenerMiddleware} from "@/features/document/middleware"
import docsReducer from "@/features/document/store/docsSlice"
import documentDownloadsReducer from "@/features/document/store/documentDownloadsSlice"
import docVersReducer from "@/features/document/store/documentVersSlice"
import imageObjects from "@/features/document/store/imageObjectsSlice"
import pagesReducer from "@/features/document/store/pagesSlice"
import documentsByCategoryReducer from "@/features/documentsList/storage/documentsByCategory"
import filesReducer from "@/features/files/storage/files"
import groupsReducer from "@/features/groups/storage/group"
import nodesReducer from "@/features/nodes/storage/nodes"
import thumbnailObjects from "@/features/nodes/storage/thumbnailObjectsSlice"
import notificationsReducer from "@/features/notifications/storage/notifications"
import preferencesReducer from "@/features/preferences/storage/preference"
import rolesReducer from "@/features/roles/storage/role"
import searchReducer from "@/features/search/storage/search"
import sharedNodesReducer from "@/features/shared_nodes/store/sharedNodesSlice"
import tagsReducer from "@/features/tags/storage/tag"
import panelRegistryReducer from "@/features/ui/panelRegistry"
import uiReducer from "@/features/ui/uiSlice"
import usersReducer from "@/features/users/storage/user"
import currentUserReducer from "@/slices/currentUser"
import {configureStore} from "@reduxjs/toolkit"
import {rtkQueryErrorLogger} from "./globalErrorMiddleware"
import {listenerMiddleware} from "./listenerMiddleware"

export const store = configureStore({
  reducer: {
    auth: authSliceReducer,
    currentUser: currentUserReducer,
    panelRegistry: panelRegistryReducer,
    tags: tagsReducer,
    groups: groupsReducer,
    roles: rolesReducer,
    search: searchReducer,
    auditLogs: auditLogsReducer,
    customFields: customFieldsReducer,
    documentTypes: documentTypesReducer,
    users: usersReducer,
    nodes: nodesReducer,
    sharedNodes: sharedNodesReducer,
    pages: pagesReducer,
    imageObjects: imageObjects,
    thumbnailObjects: thumbnailObjects,
    documentDownloads: documentDownloadsReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
    docVers: docVersReducer,
    docs: docsReducer,
    files: filesReducer,
    preferences: preferencesReducer,
    documentsByCategory: documentsByCategoryReducer,
    [apiSlice.reducerPath]: apiSlice.reducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .prepend(docsListenerMiddleware.middleware)
      .concat(apiSlice.middleware)
      .concat(rtkQueryErrorLogger)
})
