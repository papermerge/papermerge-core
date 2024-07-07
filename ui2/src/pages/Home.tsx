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
  let folderId, breadcrumb

  if (params.folderId) {
    folderId = params.folderId
    breadcrumb = null
  } else {
    folderId = user.home_folder_id
    breadcrumb = [[folderId, ".home"]] as Array<[string, string]>
  }

  store.dispatch(
    setCurrentNode({
      node: {id: folderId, ctype: "folder", breadcrumb: breadcrumb},
      panel: "main"
    })
  )

  await store.dispatch(
    fetchPaginatedNodes({folderId, panel: "main", urlParams: url.searchParams})
  )

  return {folderId, urlParams: url.searchParams}
}
