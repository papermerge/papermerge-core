import {STORAGE_KEY, STORE_PERSIST_DEBOUNCE_TIME_MS} from "./constants"

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
import recentCategoriesReducer from "@/features/document/store/recentCategoriesSlice"
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
import recentDocumentLanguagesReducer from "@/store/recentDocumentLangsSlice"
import {configureStore} from "@reduxjs/toolkit"
import {rtkQueryErrorLogger} from "./globalErrorMiddleware"
import {listenerMiddleware} from "./listenerMiddleware"
import {loadPersistedState, selectStateToPersist} from "./persistStore"

const rootReducer = {
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
  recentCategories: recentCategoriesReducer,
  recentDocumentLanguages: recentDocumentLanguagesReducer,
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
}

export const store = configureStore({
  reducer: rootReducer as any,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware()
      .prepend(listenerMiddleware.middleware)
      .prepend(docsListenerMiddleware.middleware)
      .concat(apiSlice.middleware)
      .concat(rtkQueryErrorLogger),
  preloadedState: loadPersistedState()
})

/**
 * Persist/Store/Save REDUX state between page reloads
 */
let timeoutId: number
store.subscribe(() => {
  clearTimeout(timeoutId)
  timeoutId = window.setTimeout(() => {
    try {
      const stateToPersist = selectStateToPersist(store.getState())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist))
    } catch (e) {
      console.warn("Failed to persist state:", e)
    }
  }, STORE_PERSIST_DEBOUNCE_TIME_MS) // debounce writes
})

export {rootReducer}
