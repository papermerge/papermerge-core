import {apiSlice} from "@/features/api/slice"
import type {
  ColoredTag,
  FolderType,
  NodeType,
  Paginated,
  ServerNotifDocumentMoved,
  ServerNotifDocumentsMoved,
  ServerNotifPayload,
  ServerNotifType
} from "@/types"
import {getRemoteUserID, getWSURL} from "@/utils"
import {documentMovedNotifReceived, documentsMovedNotifReceived} from "./nodes"

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

type MoveNodesType = {
  body: {
    source_ids: string[]
    target_id: string
  }
  // this one is used for cache tag invalidation
  sourceFolderID: string
}

export type PaginatedArgs = {
  nodeID: string
  queryParams: NodeQueryParams
}

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {
  FolderDocuments,
  FolderTreeItem,
  NodeQueryParams
} from "@/features/nodes/types"

// backend caps `page_size` of `/nodes/{id}` at 100
const FOLDER_CHILDREN_PAGE_SIZE = 100
// only the first page of documents is fetched; folders can hold thousands
const FOLDER_DOCUMENTS_LIMIT = 100

export const apiSliceWithNodes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedNodes: builder.query<Paginated<NodeType>, PaginatedArgs>({
      query: ({nodeID, queryParams}: PaginatedArgs) => {
        const queryString = buildQueryString(queryParams || {})
        return `/nodes/${nodeID}?${queryString}`
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
        "Node", // generic Node tag
        {type: "Node", id: arg.nodeID}, // "Node" tag per parent ID
        // "Node" tag per each returned item
        ...result.items.map(({id}) => ({type: "Node", id}) as const)
      ]
    }),
    getFolderChildren: builder.query<FolderTreeItem[], string>({
      async queryFn(parentID, _api, _extraOptions, baseQuery) {
        const folders: FolderTreeItem[] = []
        let pageNumber = 1
        let numPages = 1

        do {
          const searchParams = new URLSearchParams({
            page_number: String(pageNumber),
            page_size: String(FOLDER_CHILDREN_PAGE_SIZE),
            sort_by: "title",
            sort_direction: "asc",
            filter_ctype: "folder"
          })
          const result = await baseQuery(
            `/nodes/${parentID}?${searchParams.toString()}`
          )
          if (result.error) {
            return {error: result.error}
          }
          const page = result.data as Paginated<NodeType>
          folders.push(
            ...page.items.map(({id, title, is_shared}) => ({
              id,
              title,
              is_shared
            }))
          )
          numPages = page.num_pages
          pageNumber += 1
        } while (pageNumber <= numPages)

        return {data: folders}
      },
      providesTags: (result = [], _error, parentID) => [
        "Node",
        {type: "Node", id: parentID},
        ...result.map(({id}) => ({type: "Node", id}) as const)
      ]
    }),
    getFolderDocuments: builder.query<FolderDocuments, string>({
      query: parentID => {
        const searchParams = new URLSearchParams({
          page_number: "1",
          page_size: String(FOLDER_DOCUMENTS_LIMIT),
          sort_by: "title",
          sort_direction: "asc",
          filter_ctype: "document"
        })
        return `/nodes/${parentID}?${searchParams.toString()}`
      },
      transformResponse: (page: Paginated<NodeType>) => ({
        items: page.items.map(({id, title}) => ({id, title})),
        hasMore: page.num_pages > 1
      }),
      providesTags: (result, _error, parentID) => [
        "Node",
        {type: "Node", id: parentID},
        ...(result?.items ?? []).map(({id}) => ({type: "Node", id}) as const)
      ]
    }),
    getFolder: builder.query<FolderType, string>({
      query: folderID => {
        return `/folders/${folderID}`
      },
      providesTags: (_result, _error, arg) => [{type: "Folder", id: arg}],
      async onCacheEntryAdded(arg, lifecycleApi) {
        let url = getWSURL()

        if (!url) {
          return
        }

        if (getRemoteUserID()) {
          url = `${url}?remote-user-id=${getRemoteUserID()}`
        }
        const ws = new WebSocket(url)
        try {
          // wait for the initial query to resolve before proceeding
          await lifecycleApi.cacheDataLoaded

          // when data is received from the socket connection to the server,
          // update our query result with the received message
          const listener = (event: MessageEvent<string>) => {
            const message: {
              type: ServerNotifType
              payload: ServerNotifPayload
            } = JSON.parse(event.data)

            switch (message.type) {
              case "documents_moved": {
                const payload = message.payload as ServerNotifDocumentsMoved
                let invSourceFolderTags = payload.source_folder_ids.map(i => {
                  return {type: "Folder" as const, id: i}
                })
                let invTargetFolderTags = payload.target_folder_ids.map(i => {
                  return {type: "Folder" as const, id: i}
                })
                const invTags = invTargetFolderTags.concat(invSourceFolderTags)
                lifecycleApi.dispatch(apiSlice.util.invalidateTags(invTags))
                lifecycleApi.dispatch(documentsMovedNotifReceived(payload))
                break
              }
              case "document_moved": {
                const payload = message.payload as ServerNotifDocumentMoved

                if (
                  arg == payload.source_folder_id ||
                  arg == payload.target_folder_id
                ) {
                  lifecycleApi.dispatch(
                    apiSlice.util.invalidateTags([{type: "Folder", id: arg}])
                  )
                  lifecycleApi.dispatch(documentMovedNotifReceived(payload))
                }

                break
              }

              default:
                break
            }
          }
          ws.addEventListener("message", listener)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        await lifecycleApi.cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        ws.close()
      }
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
      query: node => ({
        url: `/nodes/${node.id}`,
        method: "PATCH",
        body: node
      }),
      invalidatesTags: (_result, _error, node) => [
        "Node",
        {type: "Document", id: node.id}
      ]
    }),
    updateNodeTags: builder.mutation<NodeType, UpdateNodeTagsType>({
      query: node => ({
        url: `/nodes/${node.id}/tags`,
        method: "POST",
        body: node.tags
      }),
      invalidatesTags: (_result, _error, input) => [
        "Node",
        "Tag",
        {type: "Document", id: input.id},
        {type: "NodeTag", id: input.id}
      ]
    }),
    getNodeTags: builder.query<ColoredTag[], string>({
      query: nodeID => `/nodes/${nodeID}/tags`,
      providesTags: (_result, _error, arg) => [{type: "NodeTag", id: arg}]
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
    }),
    moveNodes: builder.mutation<void, MoveNodesType>({
      query: data => ({
        url: "/nodes/move",
        method: "POST",
        body: data.body
      }),
      // @ts-ignore
      invalidatesTags: (_result, _error, arg) => {
        /* Source IDs must be invalidated, as document nodes,
        because their breadcrumb changes. Example: say user moves
        3 nodes (one of which is a document D) from folder A two folder B.
        If user opens document D AFTER the move operation document D
        must have new breadcrumb featuring folder B.
         */
        const invalidatedDocs = arg.body.source_ids.map(i => {
          return {type: "Document", id: i}
        })
        return [
          ...invalidatedDocs,
          {type: "Node", id: arg.body.target_id},
          {type: "Node", id: arg.sourceFolderID}
        ]
      }
    })
  })
})

export const {
  useGetPaginatedNodesQuery,
  useGetFolderChildrenQuery,
  useGetFolderDocumentsQuery,
  useGetFolderQuery,
  useAddNewFolderMutation,
  useRenameFolderMutation,
  useUpdateNodeTagsMutation,
  useGetNodeTagsQuery,
  useDeleteNodesMutation,
  useMoveNodesMutation
} = apiSliceWithNodes

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
