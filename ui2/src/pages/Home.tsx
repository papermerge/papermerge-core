import {Group} from "@mantine/core"
import {useSelector} from "react-redux"
import {LoaderFunctionArgs} from "react-router"
import {useNavigation} from "react-router-dom"

import {fetchPaginatedNodes, selectPanelNodes} from "@/slices/dualPanel"
import {setCurrentNode} from "@/slices/currentNode"

import Node from "@/components/Node/Node"
import FolderNodeActions from "@/components/FolderNodeActions/FolderNodeActions"
import {getCurrentUser} from "@/utils"
import {store} from "@/app/store"
import type {RootState} from "@/app/types"
import type {User, NodeType} from "@/types"

export default function Home() {
  const nodes_data = useSelector((state: RootState) =>
    selectPanelNodes(state, "main")
  ) as Array<NodeType>
  const navigation = useNavigation()

  if (navigation.state == "loading") {
    return <div>Loading...</div>
  }

  const nodes = nodes_data.map((n: NodeType) => <Node key={n.id} node={n} />)

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
