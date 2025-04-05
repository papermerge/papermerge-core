import {apiSlice} from "@/features/api/slice"

import {
  PAGINATION_DEFAULT_ITEMS_PER_PAGES,
  SHARED_FOLDER_ROOT_ID
} from "@/cconstants"
import type {
  NodeType,
  Paginated,
  SortMenuColumn,
  SortMenuDirection
} from "@/types"
import {NewSharedNodes} from "@/types.d/shared_nodes"

export type PaginatedArgs = {
  nodeID: string
  page_number?: number
  page_size?: number
  filter?: string | null
  sortDir: SortMenuDirection
  sortColumn: SortMenuColumn
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
      ]
    }),
    addNewSharedNode: builder.mutation<void, NewSharedNodes>({
      query: shared_node => ({
        url: "/shared-nodes/",
        method: "POST",
        body: shared_node
      })
    })
  })
})

export const {useAddNewSharedNodeMutation, useGetPaginatedSharedNodesQuery} =
  apiSliceWithSharedNodes
