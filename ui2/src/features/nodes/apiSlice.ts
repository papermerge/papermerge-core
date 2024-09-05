import {apiSlice} from "@/features/api/slice"
import type {Paginated, FolderType, NodeType} from "@/types"

type CreateFolderType = {
  title: string
  parent_id: string
  ctype: "folder"
}

type RenameFolderType = {
  title: string
  id: string
}

type UpdateNodeTagsType = {
  id: string
  tags: string[]
}

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
    }),
    addNewFolder: builder.mutation<NodeType, CreateFolderType>({
      query: folder => ({
        url: "/nodes/",
        method: "POST",
        body: folder
      }),
      invalidatesTags: ["Node"]
    }),
    renameFolder: builder.mutation<NodeType, RenameFolderType>({
      query: folder => ({
        url: `/nodes/${folder.id}`,
        method: "PATCH",
        body: folder
      }),
      invalidatesTags: ["Node"]
    }),
    updateNodeTags: builder.mutation<NodeType, UpdateNodeTagsType>({
      query: node => ({
        url: `/nodes/${node.id}/tags`,
        method: "POST",
        body: node.tags
      }),
      invalidatesTags: ["Node", "Tag"]
    }),
    deleteNodes: builder.mutation<void, string[]>({
      query: nodeIDs => ({
        url: `nodes/`,
        method: "DELETE",
        body: nodeIDs
      }),
      invalidatesTags: (_result, _error, ids) =>
        ids.map(id => {
          return {type: "Node", id: id}
        })
    })
  })
})

export const {
  useGetPaginatedNodesQuery,
  useGetFolderQuery,
  useAddNewFolderMutation,
  useRenameFolderMutation,
  useUpdateNodeTagsMutation,
  useDeleteNodesMutation
} = apiSliceWithNodes
