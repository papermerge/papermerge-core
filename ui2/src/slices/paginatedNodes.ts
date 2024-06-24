import {createSlice, createAsyncThunk, PayloadAction} from "@reduxjs/toolkit"
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
  reducers: {
    folderAdded(state, action: PayloadAction<NodeType>) {
      const found: NodeLoaderResponseType = state.find(
        (pn: NodeLoaderResponseType) =>
          pn.parent.id === action.payload.parent_id
      )
      if (found) {
        found.nodes.push(action.payload)
      }
    }
  },
  extraReducers(builder) {
    builder.addCase(fetchPaginatedNodes.fulfilled, (state, action) => {
      const found = state.find(
        (pn: NodeLoaderResponseType) => pn.parent.id == action.payload.parent.id
      )

      if (!found) {
        state.push(action.payload)
      }
    })
  }
})

export const {folderAdded} = paginatedNodesSlice.actions

export default paginatedNodesSlice.reducer

export const selectPaginatedNodeById = (state: any, folderId: string) => {
  return state.paginatedNodes.find(
    (pn: NodeLoaderResponseType) => pn.parent.id === folderId
  )
}
