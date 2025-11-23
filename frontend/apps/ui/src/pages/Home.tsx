import {LoaderFunctionArgs} from "react-router"

import DualPanel from "@/components/DualPanel"

import {store} from "@/app/store"
import {getCurrentUser} from "@/utils"

import {
  setPanelComponent,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import type {User} from "@/types"

export default function Home() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const user: User = await getCurrentUser()
  let folderId

  if (params.folderId) {
    folderId = params.folderId
  } else {
    folderId = user.home_folder_id
  }

  store.dispatch(
    setPanelComponent({
      panelId: "main",
      component: "commander"
    })
  )

  store.dispatch(
    updatePanelCurrentNode({
      entityID: folderId,
      component: "commander",
      panelID: "main"
    })
  )

  return {folderId, urlParams: url.searchParams}
}
