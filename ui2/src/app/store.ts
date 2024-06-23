import {configureStore} from "@reduxjs/toolkit"
import currentUserReducer from "@/slices/currentUser.ts"
import paginatedNodesReducer from "@/slices/paginatedNodes.ts"

export const store = configureStore({
  reducer: {
    currentUser: currentUserReducer,
    paginatedNodes: paginatedNodesReducer
  }
})
