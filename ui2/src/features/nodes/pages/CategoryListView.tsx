import DualPanel from "@/components/DualPanel"
import {
  commanderViewOptionUpdated,
  mainPanelComponentUpdated
} from "@/features/ui/uiSlice"
import type {User} from "@/types"
import {getCurrentUser} from "@/utils"
import {LoaderFunctionArgs} from "react-router"

import {store} from "@/app/store"

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

  store.dispatch(mainPanelComponentUpdated("commander"))

  store.dispatch(
    commanderViewOptionUpdated({mode: "main", viewOption: "document-type"})
  )

  return {folderId, urlParams: url.searchParams}
}
