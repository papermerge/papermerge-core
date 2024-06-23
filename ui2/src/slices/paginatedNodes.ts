import {createSlice, createAsyncThunk} from "@reduxjs/toolkit"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import axios from "axios"
import type {
  Paginated,
  NodeType,
  FolderType,
  NodeLoaderResponseType
} from "@/types"

const initialState: any = []

type ThunkArgs = {
  folderId: string
  urlParams: URLSearchParams
}

export const fetchPaginatedNodes = createAsyncThunk<
  NodeLoaderResponseType,
  ThunkArgs
>("paginatedNodes/fetchNodes", async ({folderId, urlParams}: ThunkArgs) => {
  const rest_api_url = getRestAPIURL()
  const defaultHeaders = getDefaultHeaders()

  const prom = axios.all([
    axios.get(`${rest_api_url}/api/nodes/${folderId}?${urlParams}`, {
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
})

const paginatedNodesSlice = createSlice({
  name: "paginatedNodes",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchPaginatedNodes.fulfilled, (state, action) => {})
  }
})

export default paginatedNodesSlice.reducer

export const selectPaginatedNodeById = (state: any, nodeId: string) =>
  state.nodes.find((node: NodeType) => node.id === nodeId)
