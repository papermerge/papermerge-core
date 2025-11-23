import DualPanel from "@/components/DualPanel"
import {
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import {LoaderFunctionArgs} from "react-router"

import {store} from "@/app/store"

export default function DocumentsAndFoldersView() {
  return <DualPanel />
}

export async function loader({request, params}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  store.dispatch(
    setPanelComponent({
      panelId: "main",
      component: "commander"
    })
  )

  store.dispatch(
    updatePanelCurrentNode({
      entityID: params.id!,
      panelID: "main",
      component: "commander"
    })
  )

  return {urlParams: url.searchParams}
}
