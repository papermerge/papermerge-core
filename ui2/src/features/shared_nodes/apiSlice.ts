import {apiSlice} from "@/features/api/slice"

import {
  PAGINATION_DEFAULT_ITEMS_PER_PAGES,
  SHARED_FOLDER_ROOT_ID
} from "@/cconstants"
import type {
  DocumentType,
  FolderType,
  NodeType,
  Paginated,
  SortMenuColumn,
  SortMenuDirection
} from "@/types"
import {
  NewSharedNodes,
  SharedNodeAccessDetails,
  SharedNodeAccessUpdate
} from "@/types.d/shared_nodes"

export type PaginatedArgs = {
  nodeID: string
  page_number?: number
  page_size?: number
  filter?: string | null
  sortDir: SortMenuDirection
  sortColumn: SortMenuColumn
}

interface GetSharedNodeArgs {
  nodeID: string
  currentSharedRootID?: string
}

export const apiSliceWithSharedNodes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedSharedNodes: builder.query<Paginated<NodeType>, PaginatedArgs>({
      query: ({
        nodeID,
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES,
        sortDir,
        sortColumn,
        filter = undefined
      }: PaginatedArgs) => {
        const orderBy = sortDir == "az" ? sortColumn : `-${sortColumn}`

        if (!filter) {
          if (nodeID == SHARED_FOLDER_ROOT_ID) {
            return `/shared-nodes/?page_number=${page_number}&page_size=${page_size}&order_by=${orderBy}`
          } else {
            return `/shared-nodes/folder/${nodeID}?page_number=${page_number}&page_size=${page_size}&order_by=${orderBy}`
          }
        }

        if (nodeID == SHARED_FOLDER_ROOT_ID) {
          return `/shared-nodes/?page_size=${page_size}&filter=${filter}&order=${orderBy}`
        }

        return `/shared-nodes/folder/${nodeID}?page_size=${page_size}&filter=${filter}&order=${orderBy}`
      },
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        arg
      ) => [
        "SharedNode", // generic SharedNode tag
        {type: "SharedNode", id: arg.nodeID}, // "SharedNode" tag per parent ID
        // "SharedNode" tag per each returned item
        ...result.items.map(({id}) => ({type: "SharedNode", id}) as const)
      ],
      transformResponse(res: Paginated<NodeType>, _, arg) {
        if (arg.nodeID == SHARED_FOLDER_ROOT_ID) {
          for (let i = 0; i < res.items.length; i++) {
            res.items[i].is_shared_root = true
          }
        }
        return res
      }
    }),
    getSharedNodeAccessDetails: builder.query<SharedNodeAccessDetails, string>({
      query: nodeID => `/shared-nodes/access/${nodeID}`,
      providesTags: (_result, _error, arg) => [
        {type: "SharedNodeAccessDetails", id: arg}
      ]
    }),
    addNewSharedNode: builder.mutation<void, NewSharedNodes>({
      query: shared_node => ({
        url: "/shared-nodes/",
        method: "POST",
        body: shared_node
      }),
      invalidatesTags: (_result, _error, input) =>
        input.node_ids.map(node_id => {
          return {type: "Node", id: node_id}
        })
    }),
    updateSharedNodeAccess: builder.mutation<void, SharedNodeAccessUpdate>({
      query: access_update => ({
        url: `/shared-nodes/access/${access_update.id}`,
        method: "PATCH",
        body: access_update
      }),
      invalidatesTags: (_result, _error, input) => [
        {type: "Node", id: input.id}
      ]
    }),
    getSharedFolder: builder.query<FolderType, GetSharedNodeArgs>({
      query: (args: GetSharedNodeArgs) => {
        if (args.currentSharedRootID) {
          return `/shared-folders/${args.nodeID}?shared_root_id=${args.currentSharedRootID}`
        }
        return `/shared-folders/${args.nodeID}`
      },
      providesTags: (_result, _error, arg) => [
        {type: "SharedFolder", id: arg.nodeID}
      ]
    }),
    getSharedDocument: builder.query<DocumentType, GetSharedNodeArgs>({
      query: (args: GetSharedNodeArgs) => {
        if (args.currentSharedRootID) {
          return `/shared-documents/${args.nodeID}?shared_root_id=${args.currentSharedRootID}`
        }

        return `/shared-documents/${args.nodeID}`
      },
      providesTags: (_result, _error, arg) => [
        {type: "SharedDocument", id: arg.nodeID}
      ]
    })
  })
})

export const {
  useAddNewSharedNodeMutation,
  useGetPaginatedSharedNodesQuery,
  useGetSharedNodeAccessDetailsQuery,
  useUpdateSharedNodeAccessMutation,
  useGetSharedFolderQuery,
  useGetSharedDocumentQuery
} = apiSliceWithSharedNodes
