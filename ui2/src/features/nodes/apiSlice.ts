import {apiSlice} from "@/features/api/slice"
import type {
  ColoredTag,
  FolderType,
  NodeType,
  Paginated,
  ServerNotifDocumentMoved,
  ServerNotifDocumentsMoved,
  ServerNotifPayload,
  ServerNotifType,
  SortMenuColumn,
  SortMenuDirection
} from "@/types"
import {
  getBaseURL,
  getDefaultHeaders,
  getRemoteUserID,
  getWSURL,
  imageEncode
} from "@/utils"
import {
  documentMovedNotifReceived,
  documentsMovedNotifReceived
} from "./nodesSlice"

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
  page_number?: number
  page_size?: number
  filter?: string | null
  sortDir: SortMenuDirection
  sortColumn: SortMenuColumn
}

import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithNodes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedNodes: builder.query<Paginated<NodeType>, PaginatedArgs>({
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
          return `/nodes/${nodeID}?page_number=${page_number}&page_size=${page_size}&order_by=${orderBy}`
        }

        return `/nodes/${nodeID}?page_size=${page_size}&filter=${filter}&order=${orderBy}`
      },
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        arg
      ) => [
        "Node", // generic Node tag
        {type: "Node", id: arg.nodeID}, // "Node" tag per parent ID
        // "Node" tag per each returned item
        ...result.items.map(({id}) => ({type: "Node", id}) as const)
      ]
    }),
    getFolder: builder.query<FolderType, string>({
      query: folderID => `/folders/${folderID}`,
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
    getDocumentThumbnail: builder.query<string, string>({
      //@ts-ignore
      queryFn: async (node_id, queryApi) => {
        const state = queryApi.getState() as RootState

        if (!node_id) {
          console.error("Node ID is empty or null")
          return "Node ID is empty or null"
        }

        const node = state.nodes.entities[node_id]

        if (!node) {
          console.error(
            `Node with ID=${node_id} not found in state.nodes.entities`
          )
          return `Node ID = ${node_id} not found`
        }

        const thumbnails_url = node.thumbnail_url
        const headers = getDefaultHeaders()
        let url

        if (thumbnails_url && !thumbnails_url.startsWith("/api/")) {
          // cloud URL e.g. aws cloudfront URL
          url = thumbnails_url
        } else {
          // use backend server URL (which may differ from frontend's URL)
          url = `${getBaseURL(true)}${thumbnails_url}`
        }

        if (!thumbnails_url || !url) {
          console.error(
            `Thumbnail URL for Node ID=${node_id} is undefined or null`
          )
          return "node does not have thumbnail"
        }

        try {
          const response = await fetch(url, {headers: headers})
          const resp2 = await response.arrayBuffer()
          const encodedData = imageEncode(resp2, "image/jpeg")
          return {data: encodedData}
        } catch (err) {
          return {err}
        }
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
  useGetFolderQuery,
  useAddNewFolderMutation,
  useRenameFolderMutation,
  useUpdateNodeTagsMutation,
  useGetNodeTagsQuery,
  useDeleteNodesMutation,
  useGetDocumentThumbnailQuery,
  useMoveNodesMutation
} = apiSliceWithNodes
