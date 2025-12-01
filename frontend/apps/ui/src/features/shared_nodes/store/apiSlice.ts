import { apiSlice } from "@/features/api/slice"
import { NodeQueryParams } from "@/features/nodes/types"

import {
  PAGINATION_DEFAULT_ITEMS_PER_PAGES,
  SHARED_FOLDER_ROOT_ID
} from "@/cconstants"
import type { FolderType, NodeType, Paginated } from "@/types"
import {
  NewSharedNodes,
  SharedNodeAccessDetails,
  SharedNodeAccessUpdate
} from "@/types.d/shared_nodes"

import type { DocumentType } from "@/features/document/types"

export type PaginatedArgs = {
  nodeID: string
  queryParams: NodeQueryParams
}

export type PaginatedTopLevelArgs = {
  queryParams: NodeQueryParams
}

interface GetSharedNodeArgs {
  nodeID: string
  currentSharedRootID?: string
}

export const apiSliceWithSharedNodes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedSharedRootNodes: builder.query<
      Paginated<NodeType>,
      PaginatedTopLevelArgs
    >({
      query: ({queryParams}: PaginatedTopLevelArgs) => {
        const queryString = buildQueryString(queryParams || {})
        return `/shared-nodes?${queryString}`
      },
      providesTags: (
        result = {
          page_number: 1,
          page_size: 1,
          num_pages: 1,
          items: [],
          total_items: 1
        },
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
  useGetPaginatedSharedRootNodesQuery, // get top level shared nodes
  useGetSharedNodeAccessDetailsQuery,
  useUpdateSharedNodeAccessMutation,
  useGetSharedFolderQuery,
  useGetSharedDocumentQuery
} = apiSliceWithSharedNodes

function buildQueryString(params: NodeQueryParams = {}): string {
  const searchParams = new URLSearchParams()

  // Always include pagination with defaults
  searchParams.append("page_number", String(params.page_number || 1))
  searchParams.append(
    "page_size",
    String(params.page_size || PAGINATION_DEFAULT_ITEMS_PER_PAGES)
  )

  // Add sorting if provided
  if (params.sort_by) {
    searchParams.append("sort_by", params.sort_by)
  }
  if (params.sort_direction) {
    searchParams.append("sort_direction", params.sort_direction)
  }

  if (params.filter_free_text) {
    searchParams.append("filter_free_text", params.filter_free_text)
  }

  return searchParams.toString()
}
