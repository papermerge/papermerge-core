import {RootState} from "@/app/types"
import {
  ONE_DAY_IN_SECONDS,
  PAGINATION_DEFAULT_ITEMS_PER_PAGES
} from "@/cconstants"
import {apiSlice} from "@/features/api/slice"
import type {
  DocumentCFV,
  ExtractPagesResponse,
  Paginated,
  ServerNotifDocumentMoved,
  ServerNotifPayload,
  ServerNotifType
} from "@/types"
import {
  CFV,
  DocumentType,
  ExtractStrategyType,
  OrderType,
  TransferStrategyType
} from "@/types"
import {
  getBaseURL,
  getDefaultHeaders,
  getRemoteUserID,
  getWSURL,
  imageEncode
} from "@/utils"
import {DOC_VER_PAGINATION_PAGE_SIZE} from "./constants"

import {
  documentMovedNotifReceived,
  docVerPaginationUpdated,
  docVerUpserted
} from "./documentVersSlice"
import type {DocVersList} from "./types"

type ShortPageType = {
  number: number
  id: string
}

type PagesType = {
  angle: number
  page: ShortPageType
}

type ApplyPagesType = {
  documentID: string
  pages: PagesType[]
}

type MovePagesType = {
  body: {
    source_page_ids: string[]
    target_page_id: string
    move_strategy: TransferStrategyType
  }
  sourceDocID: string
  targetDocID: string
  sourceDocParentID: string
}

type ExtractPagesType = {
  body: {
    source_page_ids: string[]
    target_folder_id: string
    strategy: ExtractStrategyType
    title_format: string
  }
  sourceDocID: string
  sourceDocParentID: string
}

type UpdateDocumentCustomFields = {
  documentID: string
  documentTypeID: string
  body: Array<{
    custom_field_value_id?: string
    key: string
    value: string | boolean
  }>
}

interface UpdateDocumentTypeArgs {
  document_id?: string
  invalidatesTags: {
    documentTypeID?: string
  }
  body: {
    document_type_id: string | null
  }
}

interface GetDocsByTypeArgs {
  document_type_id: string
  page_number: number
  page_size: number
  order_by?: string | null
  order?: OrderType
}

interface BasicPage {
  id: string
  number: number
}

interface DLVPaginatedArgsInput {
  doc_id: string
  page_number: number
  page_size: number
}

interface DLVPaginatedArgsOutput {
  doc_ver_id: string
  lang: string
  number: number
  file_name: string
  pages: Array<BasicPage>
  page_size: number
  page_number: number
  num_pages: number
  total_count: number
}

export const apiSliceWithDocuments = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getDocLastVersionPaginated: builder.query<
      DLVPaginatedArgsOutput,
      DLVPaginatedArgsInput
    >({
      query: ({doc_id, page_number, page_size}: DLVPaginatedArgsInput) => {
        return `/documents/${doc_id}/last-version/pages/?page_number=${page_number}&page_size=${page_size}`
      },

      async onQueryStarted(
        {doc_id, page_number, page_size},
        {dispatch, queryFulfilled}
      ) {
        try {
          const {data} = await queryFulfilled

          const transformedVersion = {
            id: data.doc_ver_id,
            lang: data.lang,
            number: data.number,
            file_name: data.file_name,
            pages: data.pages.map(p => ({
              id: p.id,
              number: p.number,
              angle: 0
            })),
            initial_pages: data.pages.map(p => ({
              id: p.id,
              number: p.number,
              angle: 0
            })),
            pagination: {
              page_number: 1,
              per_page: DOC_VER_PAGINATION_PAGE_SIZE
            }
          }

          // Save document version to the state
          dispatch(docVerUpserted(transformedVersion))

          // Save pagination info to the state
          dispatch(
            docVerPaginationUpdated({
              docVerID: transformedVersion.id,
              pageNumber: page_number,
              pageSize: page_size
            })
          )
        } catch (error) {
          console.error("Failed to save paginated doc version to state:", error)
        }
      }
    }),
    getDocVersionsList: builder.query<DocVersList, string>({
      query: nodeID => `/documents/${nodeID}/versions/`,
      providesTags: (_result, _error, arg) => [{type: "DocVersList", id: arg}]
    }),
    getDocument: builder.query<DocumentType, string>({
      query: nodeID => `/documents/${nodeID}`,
      providesTags: (_result, _error, arg) => [{type: "Document", id: arg}],
      async onCacheEntryAdded(_arg, lifecycleApi) {
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
            console.log(`${message.type} received`)
            console.log(message.payload)
            switch (message.type) {
              case "document_moved": {
                const payload = message.payload as ServerNotifDocumentMoved
                console.log(`Invalidating Document ${payload.document_id}`)
                lifecycleApi.dispatch(
                  apiSlice.util.invalidateTags([
                    {
                      type: "Document",
                      id: payload.document_id
                    },
                    {
                      type: "Node",
                      id: payload.source_folder_id
                    },
                    {
                      type: "Node",
                      id: payload.target_folder_id
                    }
                  ])
                )
                lifecycleApi.dispatch(documentMovedNotifReceived(payload))
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
    getPageImage: builder.query<string, string>({
      //@ts-ignore
      queryFn: async (page_id, queryApi) => {
        const state = queryApi.getState() as RootState

        if (!page_id) {
          console.error("Page ID is empty or null")
          return "Page ID is empty or null"
        }

        const page = state.pages.entities[page_id]

        if (!page) {
          console.error(
            `Page with ID=${page_id} not found in state.pages.entities`
          )
          return `Page ID = ${page_id} not found`
        }

        const page_url = page.jpg_url
        const headers = getDefaultHeaders()
        let url

        if (page_url && !page_url.startsWith("/api/")) {
          // cloud URL e.g. aws cloudfront URL
          url = page_url
        } else {
          // use backend server URL (which may differ from frontend's URL)
          url = `${getBaseURL(true)}${page_url}`
        }

        if (!page_url || !url) {
          console.error(`Page URL for Node ID=${page_id} is undefined or null`)
          return "page does not have preview :("
        }

        try {
          const response = await fetch(url, {headers: headers})
          const resp2 = await response.arrayBuffer()
          const encodedData = imageEncode(resp2, "image/jpeg")
          return {data: encodedData}
        } catch (err) {
          return {err}
        }
      },
      keepUnusedDataFor: ONE_DAY_IN_SECONDS
    }),
    applyPageOpChanges: builder.mutation<void, ApplyPagesType>({
      query: data => ({
        url: "/pages/",
        method: "POST",
        body: data.pages
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: "Document", id: arg.documentID}
      ]
    }),
    movePages: builder.mutation<void, MovePagesType>({
      query: data => ({
        url: "/pages/move",
        method: "POST",
        body: data.body
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: "Document", id: arg.targetDocID},
        {type: "Document", id: arg.sourceDocID},
        {type: "Node", id: arg.sourceDocParentID}
      ]
    }),
    extractPages: builder.mutation<ExtractPagesResponse, ExtractPagesType>({
      query: data => ({
        url: "/pages/extract",
        method: "POST",
        body: data.body
      }),
      invalidatesTags: (_result, _error, arg) => {
        return [
          {type: "Document", id: arg.sourceDocID},
          {type: "Node", id: arg.sourceDocParentID},
          {type: "Node", id: arg.body.target_folder_id}
        ]
      }
    }),
    updateDocumentCustomFields: builder.mutation<
      void,
      UpdateDocumentCustomFields
    >({
      query: data => ({
        url: `/documents/${data.documentID}/custom-fields`,
        method: "PATCH",
        body: data.body
      }),
      invalidatesTags: (_result, _error, arg) => {
        return [
          {type: "DocumentCustomField", id: arg.documentID},
          {type: "DocumentCFV", id: arg.documentTypeID}
        ]
      }
    }),
    updateDocumentType: builder.mutation<void, UpdateDocumentTypeArgs>({
      query: data => ({
        url: `/documents/${data.document_id}/type`,
        method: "PATCH",
        body: data.body
      }),
      invalidatesTags: (_result, _error, arg) => {
        return [
          {type: "Document", id: arg.document_id},
          {type: "DocumentCFV", id: arg.invalidatesTags.documentTypeID}
        ]
      }
    }),
    getDocumentCustomFields: builder.query<CFV[], string>({
      query: documentID => ({
        url: `/documents/${documentID}/custom-fields`
      }),
      providesTags: (_result, _error, arg) => [
        {type: "DocumentCustomField", id: arg}
      ]
    }),
    getDocsByType: builder.query<Paginated<DocumentCFV>, GetDocsByTypeArgs>({
      query: ({
        document_type_id,
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES,
        order_by,
        order
      }: GetDocsByTypeArgs) => {
        // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
        if (order_by) {
          const params = new URLSearchParams({
            order_by: order_by,
            order: `${order ? order : "asc"}`,
            page_number: String(page_number),
            page_size: String(page_size)
          })

          return {
            url: `/documents/type/${document_type_id}?${params.toString()}`
          }
        }
        const params = new URLSearchParams({
          page_number: String(page_number),
          page_size: String(page_size)
        })

        return {
          url: `/documents/type/${document_type_id}?${params.toString()}`
        }
      },
      providesTags: (_result, _error, args) => [
        {type: "DocumentCFV", id: args.document_type_id}
      ]
    })
  })
})

export const {
  useGetDocLastVersionPaginatedQuery,
  useGetDocumentQuery,
  useGetPageImageQuery,
  useGetDocVersionsListQuery,
  useApplyPageOpChangesMutation,
  useMovePagesMutation,
  useExtractPagesMutation,
  useUpdateDocumentCustomFieldsMutation,
  useUpdateDocumentTypeMutation,
  useGetDocumentCustomFieldsQuery,
  useGetDocsByTypeQuery
} = apiSliceWithDocuments
