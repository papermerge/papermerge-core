import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {LoaderFunctionArgs} from "react-router"
import {useNavigation, useLoaderData} from "react-router-dom"

import {fetchPaginatedNodes} from "@/slices/paginatedNodes"
import {selectPaginatedNodeById} from "@/slices/paginatedNodes"
import {setCurrentNode} from "@/slices/currentNode"

import Node from "@/components/Node/Node"
import FolderNodeActions from "@/components/FolderNodeActions/FolderNodeActions"
import {getCurrentUser} from "@/utils"
import {store} from "@/app/store"
import type {User, NodeType, NodeLoaderResponseType} from "@/types"

type loaderDataType = {
  folderId: string
  urlParams: URLSearchParams
}

export default function Folder() {
  const {folderId, urlParams} = useLoaderData() as loaderDataType
  const data = useSelector(state =>
    selectPaginatedNodeById(state, folderId)
  ) as NodeLoaderResponseType
  const navigation = useNavigation()

  if (navigation.state == "loading") {
    return <div>Loading...</div>
  }

  const nodes = data.nodes.map((n: NodeType) => <Node key={n.id} node={n} />)

  if (nodes.length > 0) {
    return (
      <div>
        <FolderNodeActions />
        <Group>{nodes}</Group>
      </div>
    )
  }

  return (
    <div>
      <FolderNodeActions />
      <Group>Empty</Group>
    </div>
  )
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

  store.dispatch(setCurrentNode(folderId))

  await store.dispatch(
    fetchPaginatedNodes({folderId, urlParams: url.searchParams})
  )

  return {folderId, urlParams: url.searchParams}
}
