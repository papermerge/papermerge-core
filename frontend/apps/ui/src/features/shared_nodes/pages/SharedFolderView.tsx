import {store} from "@/app/store"
import DualPanel from "@/components/DualPanel"
import {
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import {LoaderFunctionArgs} from "react-router"

export default function SharedFolderView() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  let folderId = "shared"

  if (params.folderId) {
    folderId = params.folderId
  }

  store.dispatch(
    setPanelComponent({
      panelId: "main",
      component: "sharedCommander"
    })
  )

  store.dispatch(
    updatePanelCurrentNode({
      component: "sharedCommander",
      panelID: "main",
      entityID: folderId
    })
  )

  return {folderId, urlParams: url.searchParams}
}
