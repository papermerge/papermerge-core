import {apiSlice} from "@/features/api/slice"
import type {Paginated, FolderType, NodeType} from "@/types"
import {
  uploaderFileItemAdded,
  uploaderFileItemFailed,
  UpdateFileStatusArg
} from "@/features/ui/uiSlice"

type CreateFolderType = {
  title: string
  parent_id: string
  ctype: "folder"
}

type CreateDocumentNodeType = {
  title: string
  target: FolderType
  ocr: boolean
  ctype: "document"
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
  filter?: string | null
}

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithNodes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedNodes: builder.query<Paginated<NodeType>, PaginatedArgs | void>(
      {
        query: ({
          nodeID,
          page_number = 1,
          page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES,
          filter = undefined
        }: PaginatedArgs) => {
          if (!filter) {
            return `/nodes/${nodeID}?page_number=${page_number}&page_size=${page_size}`
          }

          return `/nodes/${nodeID}?page_size=${page_size}&filter=${filter}`
        },
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
    addNewDocumentNode: builder.mutation<NodeType, CreateDocumentNodeType>({
      query: docData => ({
        url: "/nodes/",
        method: "POST",
        body: {
          parent_id: docData.target.id,
          title: docData.title,
          ocr: docData.ocr,
          ctype: "document"
        }
      }),
      invalidatesTags: ["Node"],
      async onQueryStarted(arg, {dispatch, queryFulfilled}) {
        let itemData: UpdateFileStatusArg = {
          item: {
            source: null,
            file_name: arg.title,
            target: arg.target
          },
          status: "uploading",
          error: null
        }
        dispatch(uploaderFileItemAdded(itemData))
        try {
          await queryFulfilled
        } catch (err) {
          dispatch(uploaderFileItemFailed(itemData))
        }
      }
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
  useAddNewDocumentNodeMutation,
  useRenameFolderMutation,
  useUpdateNodeTagsMutation,
  useDeleteNodesMutation
} = apiSliceWithNodes
