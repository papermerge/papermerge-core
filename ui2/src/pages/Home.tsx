import {LoaderFunctionArgs} from "react-router"

import DualPanel from "@/components/DualPanel"

import {getCurrentUser} from "@/utils"
import {store} from "@/app/store"

import type {User} from "@/types"
import {currentNodeChanged} from "@/features/ui/uiSlice"

export default function Home() {
  return <DualPanel />
}

export async function loader({params, request}: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const user: User = await getCurrentUser()
  let folderId, breadcrumb

  if (params.folderId) {
    folderId = params.folderId
    breadcrumb = null
  } else {
    folderId = user.home_folder_id
    breadcrumb = [[folderId, ".home"]] as Array<[string, string]>
  }

  store.dispatch(
    currentNodeChanged({
      id: folderId,
      ctype: "folder",
      panel: "main"
    })
  )

  return {folderId, urlParams: url.searchParams}
}
