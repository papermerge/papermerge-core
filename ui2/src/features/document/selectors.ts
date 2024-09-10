import {PanelMode} from "@/types"
import {RootState} from "@/app/types"

export const selectCurrentDocumentVersionNumber = (
  state: RootState,
  mode: PanelMode
) => {
  if (mode == "main") {
    return state.ui.mainViewer?.currentDocumentVersion
  }

  return state.ui.secondaryViewer?.currentDocumentVersion
}
