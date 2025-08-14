import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSlice} from "@/features/api/slice"
import type {
  DocumentCFV,
  ExtractPagesResponse,
  MovePagesReturnType,
  Paginated,
  ServerNotifDocumentMoved,
  ServerNotifPayload,
  ServerNotifType
} from "@/types"
import {CFV, ExtractStrategyType, MovePagesType, OrderType} from "@/types"
import {getRemoteUserID, getWSURL} from "@/utils"

import type {DocVersList, PagesType} from "@/features/document/types"
import {DocumentType, DocumentVersion} from "@/features/document/types"
import {documentMovedNotifReceived} from "./documentVersSlice"

type ApplyPagesType = {
  documentID: string
  pages: PagesType[]
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

export const apiSliceWithDocuments = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getDocLastVersion: builder.query<DocumentVersion, string>({
      query: nodeID => `/documents/${nodeID}/last-version/`,
      providesTags: (_result, _error, arg) => [
        {type: "DocumentVersion", id: arg}
      ]
    }),
    getDocVersionsList: builder.query<DocVersList, string>({
      query: nodeID => `/documents/${nodeID}/versions`,
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
    applyPageOpChanges: builder.mutation<DocumentType, ApplyPagesType>({
      query: data => ({
        url: "/pages/",
        method: "POST",
        body: data.pages
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: "Document", id: arg.documentID}
      ]
    }),
    movePages: builder.mutation<MovePagesReturnType, MovePagesType>({
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
  useGetDocumentQuery,
  useGetDocLastVersionQuery,
  useGetDocVersionsListQuery,
  useApplyPageOpChangesMutation,
  useMovePagesMutation,
  useExtractPagesMutation,
  useUpdateDocumentCustomFieldsMutation,
  useUpdateDocumentTypeMutation,
  useGetDocumentCustomFieldsQuery,
  useGetDocsByTypeQuery
} = apiSliceWithDocuments
