import DualPanel from "@/components/DualPanel"
import type {User} from "@/types"
import {getCurrentUser} from "@/utils"
import {LoaderFunctionArgs} from "react-router"

import {store} from "@/app/store"
import {currentNodeChanged} from "@/features/ui/uiSlice"

export default function CategoryListView() {
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
    currentNodeChanged({
      id: folderId,
      ctype: "folder",
      panel: "main"
    })
  )

  return {folderId, urlParams: url.searchParams}
}
