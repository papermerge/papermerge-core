import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
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

  store.dispatch(
    setPanelComponent({
      panelId: "main",
      component: "sharedViewer"
    })
  )

  store.dispatch(
    updatePanelCurrentNode({
      component: "sharedViewer",
      panelID: "main",
      entityID: documentId
    })
  )

  return {documentId, urlParams: url.searchParams}
}
