import {useAppSelector} from "@/app/hooks"

import {
  isHTTP403Forbidden,
  isHTTP404NotFound,
  isHTTP422UnprocessableContent
} from "@/services/helpers"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"

import {
  ERRORS_403_ACCESS_FORBIDDEN,
  ERRORS_404_RESOURCE_NOT_FOUND,
  ERRORS_422_UNPROCESSABLE_CONTENT
} from "@/cconstants"
import type {PanelMode} from "@/types"
import {useNavigate} from "react-router-dom"

import Viewer from "@/features/document/components/Viewer"

import Commander from "@/features/nodes/components/Commander"
import SearchResults from "@/features/search/components/SearchResults"
import SharedCommander from "@/features/shared_nodes/components/SharedCommander"
import SharedViewer from "@/features/shared_nodes/components/SharedViewer"

import {selectPanelComponent} from "@/features/ui/uiSlice"
import useCurrentDoc from "./useCurrentDoc"

export default function SinglePanel() {
  const mode: PanelMode = useContext(PanelContext)
  const navigate = useNavigate()
  const panelComponent = useAppSelector(s => selectPanelComponent(s, mode))
  const {isLoading, isError, error, doc, docVer} = useCurrentDoc()

  if (isError && isHTTP422UnprocessableContent(error)) {
    navigate(ERRORS_422_UNPROCESSABLE_CONTENT)
  }

  if (isError && isHTTP404NotFound(error)) {
    navigate(ERRORS_404_RESOURCE_NOT_FOUND)
  }

  if (isError && isHTTP403Forbidden(error)) {
    navigate(ERRORS_403_ACCESS_FORBIDDEN)
  }
  /* This code was inside viewer
  useEffect(() => {
    // In case user decides to transfer all source pages,
    //  the source document will vanish as server will remove it.
    //  The outcome is that `useGetDocumentQuery` will result in
    //  error with HTTP status 404. In this case we close
    //  panel of the delete document.

    if (isError && error && (error as ServerErrorType).status == 404) {
      if (mode == "secondary") {
        // the 404 was in secondary panel. Just close it.
        dispatch(secondaryPanelClosed())
      } else {
        if (secondaryPanelNodeID && secondaryPanelNodeCType) {
          // the 404 is in main panel. In this case, open
          // in main panel whatever was in secondary
          dispatch(
            currentNodeChanged({
              id: secondaryPanelNodeID,
              ctype: secondaryPanelNodeCType,
              panel: "main"
            })
          )
          // and then close secondary panel
          dispatch(secondaryPanelClosed())
        }
      }
    }
  }, [isError])
  */

  if (panelComponent == "commander") {
    return <Commander />
  }

  if (panelComponent == "viewer") {
    if (isLoading || !doc || !docVer) {
      return <div>Loading...</div>
    } else {
      return <Viewer docVer={docVer} doc={doc} />
    }
  }

  if (panelComponent == "searchResults") {
    return <SearchResults />
  }

  if (panelComponent == "sharedCommander") {
    return <SharedCommander />
  }

  if (panelComponent == "sharedViewer") {
    return <SharedViewer />
  }

  return <>Error: neither viewer nor commander</>
}
