import {RootState} from "@/app/types"
import {PanelMode} from "@/types"

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
