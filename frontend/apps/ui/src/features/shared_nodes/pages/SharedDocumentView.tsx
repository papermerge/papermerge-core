import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {currentSharedNodeChanged} from "@/features/ui/uiSlice"
import {LoaderFunctionArgs} from "react-router"

export default function SharedDocumentView() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let documentId = "shared"

  if (params.documentId) {
    documentId = params.documentId
  }

  //store.dispatch(mainPanelComponentUpdated("sharedViewer"))

  store.dispatch(
    currentSharedNodeChanged({id: documentId, ctype: "document", panel: "main"})
  )

  return {documentId, urlParams: url.searchParams}
}
