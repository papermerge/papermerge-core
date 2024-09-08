import {LoaderFunctionArgs} from "react-router"

import DualPanel from "@/components/DualPanel"
import {currentNodeChanged} from "@/features/ui/uiSlice"

import {getCurrentUser} from "@/utils"
import {store} from "@/app/store"

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
    folderId = user.inbox_folder_id
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
