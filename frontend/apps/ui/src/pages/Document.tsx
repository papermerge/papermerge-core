import DualPanel from "@/components/DualPanel"
import {LoaderFunctionArgs} from "react-router"

import {store} from "@/app/store"

import {
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"

export default function Document() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const documentId = params.documentId

  store.dispatch(
    setPanelComponent({
      panelId: "main",
      component: "viewer"
    })
  )

  store.dispatch(
    updatePanelCurrentNode({
      entityID: documentId!,
      component: "viewer",
      panelID: "main"
    })
  )

  return {documentId, urlParams: url.searchParams}
}
