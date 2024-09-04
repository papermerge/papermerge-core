import {apiSlice} from "@/features/api/slice"
import type {Paginated, FolderType, NodeType} from "@/types"

export type PaginatedArgs = {
  nodeID: string
  page_number?: number
  page_size?: number
}

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithNodes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedNodes: builder.query<Paginated<NodeType>, PaginatedArgs | void>(
      {
        query: ({
          nodeID,
          page_number = 1,
          page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES
        }: PaginatedArgs) =>
          `/nodes/${nodeID}?page_number=${page_number}&page_size=${page_size}`,
        providesTags: (
          result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
          _error,
          _arg
        ) => [
          "Node",
          ...result.items.map(({id}) => ({type: "Node", id}) as const)
        ]
      }
    ),
    getFolder: builder.query<FolderType, string>({
      query: folderID => `/folders/${folderID}`,
      providesTags: (_result, _error, arg) => [{type: "Folder", id: arg}]
    })
  })
})

export const {useGetPaginatedNodesQuery, useGetFolderQuery} = apiSliceWithNodes
