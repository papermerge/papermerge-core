import {LoaderFunctionArgs} from "react-router"

import DualPanel from "@/components/DualPanel"

import {store} from "@/app/store"
import {getCurrentUser} from "@/utils"

import {setPanelComponent} from "@/features/ui/panelRegistry"
import {currentNodeChanged} from "@/features/ui/uiSlice"
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
    currentNodeChanged({
      id: folderId,
      ctype: "folder",
      panel: "main"
    })
  )

  return {folderId, urlParams: url.searchParams}
}
