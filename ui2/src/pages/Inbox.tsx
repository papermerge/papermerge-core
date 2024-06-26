import {LoaderFunctionArgs} from "react-router"

import DualPanel from "@/components/DualPanel"
import {fetchPaginatedNodes, setCurrentNode} from "@/slices/dualPanel"

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
    setCurrentNode({
      node: {id: folderId, ctype: "folder"},
      panel: "main"
    })
  )

  await store.dispatch(
    fetchPaginatedNodes({folderId, panel: "main", urlParams: url.searchParams})
  )

  return {folderId, urlParams: url.searchParams}
}
