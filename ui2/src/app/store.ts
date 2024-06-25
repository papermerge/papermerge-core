import {configureStore} from "@reduxjs/toolkit"
import currentUserReducer from "@/slices/currentUser"
import paginatedNodesReducer from "@/slices/paginatedNodes"
import currentNodeReducer from "@/slices/currentNode"
import dualPanelReducer from "@/slices/dualPanel"

export const store = configureStore({
  reducer: {
    currentUser: currentUserReducer,
    paginatedNodes: paginatedNodesReducer,
    currentNode: currentNodeReducer,
    dualPanel: dualPanelReducer
  }
})
