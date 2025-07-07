import {createListenerMiddleware, isAnyOf} from "@reduxjs/toolkit"
import {apiSliceWithDocuments} from "./store/apiSlice"
import type {DocSliceEntity} from "./store/docsSlice"
import {upsertDoc} from "./store/docsSlice"
import {DocumentVersion} from "./types"

const docsListenerMiddleware = createListenerMiddleware()

docsListenerMiddleware.startListening({
  matcher: isAnyOf(
    apiSliceWithDocuments.endpoints.getDocLastVersion.matchFulfilled
  ),
  effect: async (action, listenerApi) => {
    /** Store document latest version association */
    const docVer = action.payload as DocumentVersion
    const doc: DocSliceEntity = {
      id: docVer.document_id,
      latestDocVer: {
        docVerID: docVer.id,
        number: docVer.number
      }
    }
    listenerApi.dispatch(upsertDoc(doc))
  }
})

export {docsListenerMiddleware}
