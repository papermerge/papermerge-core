import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import {LoaderFunctionArgs} from "react-router"

export default function SharedNodesListView() {
  return <DualPanel />
}

export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url)

  store.dispatch(
    setPanelComponent({
      panelId: "main",
      component: "sharedCommander"
    })
  )

  store.dispatch(
    updatePanelCurrentNode({
      component: "sharedCommander",
      panelID: "main"
    })
  )

  return {urlParams: url.searchParams}
}
