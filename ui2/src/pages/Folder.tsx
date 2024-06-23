import {Group, Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"
import {LoaderFunctionArgs, useLoaderData} from "react-router"
import {useNavigation} from "react-router-dom"
import {getCurrentUser} from "@/utils"
import {fetchPaginatedNodes} from "@/slices/paginatedNodes"
import Node from "@/components/Node/Node"
import {store} from "@/app/store"
import type {User, NodeType, NodeLoaderResponseType} from "@/types"
import create_new_folder from "@/components/modals/NewFolder"

export default function Folder() {
  const data: NodeLoaderResponseType = useLoaderData() as NodeLoaderResponseType
  const navigation = useNavigation()

  if (navigation.state == "loading") {
    return <div>Loading...</div>
  }

  const nodes = data.nodes.map((n: NodeType) => <Node key={n.id} node={n} />)
  const onNewFolder = () => {
    create_new_folder(data.parent.id)
  }

  if (nodes.length > 0) {
    return (
      <div>
        <Group justify="center">
          <Button
            leftSection={<IconPlus size={14} />}
            onClick={onNewFolder}
            variant="default"
          >
            New Folder
          </Button>
        </Group>
        <Group>{nodes}</Group>
      </div>
    )
  }

  return (
    <div>
      <Group justify="center">
        <Button leftSection={<IconPlus size={14} />} variant="default">
          New Folder
        </Button>
      </Group>
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

  const result = await store.dispatch(
    fetchPaginatedNodes({folderId, urlParams: url.searchParams})
  )

  return result.payload
}
