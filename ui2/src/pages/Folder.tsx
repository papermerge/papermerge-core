import axios from "axios"

import {LoaderFunctionArgs, useLoaderData} from "react-router"
import {useNavigation} from "react-router-dom"
import {getRestAPIURL, getDefaultHeaders, getCurrentUser} from "@/utils"
import Node from "@/components/Node/Node"

import type {
  User,
  Paginated,
  NodeType,
  FolderType,
  NodeLoaderResponseType
} from "@/types"

export default function Folder() {
  const data: NodeLoaderResponseType = useLoaderData() as NodeLoaderResponseType
  const navigation = useNavigation()

  if (navigation.state == "loading") {
    return <div>Loading...</div>
  }

  const nodes = data.nodes.map((n: NodeType) => <Node key={n.id} node={n} />)

  if (nodes.length > 0) {
    return <div>{nodes}</div>
  }

  return <div>Empty</div>
}

export async function loader({
  params,
  request
}: LoaderFunctionArgs): Promise<NodeLoaderResponseType> {
  const url = new URL(request.url)
  const rest_api_url = getRestAPIURL()
  const defaultHeaders = getDefaultHeaders()
  const user: User = await getCurrentUser()
  let folderId

  if (params.folderId) {
    folderId = params.folderId
  } else {
    folderId = user.home_folder_id
  }

  const prom = axios.all([
    axios.get(`${rest_api_url}/api/nodes/${folderId}?${url.searchParams}`, {
      headers: defaultHeaders
    }),
    axios.get(`${rest_api_url}/api/folders/${folderId}`, {
      headers: defaultHeaders
    })
  ])
  const [nodesResp, folderResp] = await prom

  if (!nodesResp) {
    throw new Response("", {
      status: 404,
      statusText: "Not Found"
    })
  }

  const paginatedNodes = nodesResp.data as Paginated<NodeType>
  const folder = folderResp.data as FolderType

  const result = {
    nodes: paginatedNodes.items,
    parent: folder,
    breadcrumb: folder.breadcrumb,
    per_page: paginatedNodes.page_size,
    num_pages: paginatedNodes.num_pages,
    page_number: paginatedNodes.page_number
  }

  return result
}
