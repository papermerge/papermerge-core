import {LoaderFunctionArgs} from "react-router"
import DualPanel from "@/components/DualPanel"

import {store} from "@/app/store"
import {currentNodeChanged} from "@/features/ui/uiSlice"

import {setPanelComponent} from "@/features/ui/panelRegistry"

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
    currentNodeChanged({
      id: params.documentId!,
      ctype: "document",
      panel: "main"
    })
  )

  return {documentId, urlParams: url.searchParams}
}
