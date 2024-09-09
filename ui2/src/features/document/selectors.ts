import {createSelector} from "@reduxjs/toolkit"
import {PanelMode, DocumentType} from "@/types"
import {RootState} from "@/app/types"
import {apiSliceWithDocuments} from "./apiSlice"

export const selectDocumentResult = (
  state: RootState,
  mode: PanelMode,
  nodeID: string,
) => apiSliceWithDocuments.endpoints.getDocument.select(nodeID)

const selectCurDocVerNumber = (state: RootState, mode: PanelMode) => {
  if (mode == "main") {
    return state.ui.mainViewer?.currentDocumentVersion
  }

  return state.ui.secondaryViewer?.currentDocumentVersion
}

export const selectDocumentCurrentVersion = createSelector(
  [selectDocumentResult, selectCurDocVerNumber],
  (result, docVerNumber?: number) => {
    const doc = result as unknown as DocumentType
    debugger
    let maxVerNum = docVerNumber

    if (!maxVerNum) {
      maxVerNum = Math.max(...doc.versions.map(v => v.number))
    }

    return doc.versions.find(v => v.number == maxVerNum)
  }
)
