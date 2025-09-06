import {customFieldCRUDListeners} from "@/features/custom-fields/customFieldsSlice"
import {documentTypeCRUDListeners} from "@/features/document-types/documentTypesSlice"
import {moveNodesListeners} from "@/features/nodes/nodesSlice"
import {roleCRUDListeners} from "@/features/roles/storage/role"

import {addListener, createListenerMiddleware} from "@reduxjs/toolkit"
import type {AppDispatch, RootState} from "./types"

export const listenerMiddleware = createListenerMiddleware()

export const startAppListening = listenerMiddleware.startListening.withTypes<
  RootState,
  AppDispatch
>()
export type AppStartListening = typeof startAppListening

export const addAppListener = addListener.withTypes<RootState, AppDispatch>()
export type AppAddListener = typeof addAppListener

moveNodesListeners(startAppListening)
roleCRUDListeners(startAppListening)
documentTypeCRUDListeners(startAppListening)
customFieldCRUDListeners(startAppListening)
