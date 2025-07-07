import {RootState} from "@/app/types"
import {PanelMode} from "@/types"
import type {DocumentType} from "../types"
import {apiSliceWithDocuments} from "./apiSlice"

export const selectCurrentDocumentVersionNumber = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.ui.mainViewer?.currentDocumentVersion
  }

  return state.ui.secondaryViewer?.currentDocumentVersion
}

export const selectBestImageByPageId = (
  state: RootState,
  page_id: string
): string | undefined => {
  const sizes = state.imageObjects.pageIDEntities[page_id]
  return sizes?.xl || sizes?.lg || sizes?.md || sizes?.sm
}

export const selectSmallImageByPageId = (
  state: RootState,
  page_id: string
): string | undefined => {
  const sizes = state.imageObjects.pageIDEntities[page_id]
  return sizes?.sm
}

export const selectCurrentDoc = (state: RootState, mode: PanelMode) => {
  let curNode
  if (mode == "main") {
    curNode = state.ui.currentNodeMain
  } else {
    curNode = state.ui.currentNodeSecondary
  }

  if (curNode && curNode.ctype == "document") {
    const docID = curNode.id
    const result =
      apiSliceWithDocuments.endpoints.getDocument.select(docID)(state)
    return result.data as DocumentType
  }

  return undefined
}
