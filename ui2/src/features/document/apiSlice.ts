import {RootState} from "@/app/types"
import {ONE_DAY_IN_SECONDS} from "@/cconstants"
import {apiSlice} from "@/features/api/slice"
import type {CustomFieldValueType} from "@/types"
import {DocumentType, ExtractStrategyType, TransferStrategyType} from "@/types"
import {getBaseURL, getDefaultHeaders, imageEncode} from "@/utils"

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
  body: {
    document_type_id: string
    custom_fields: Array<CustomFieldValueType>
  }
}

export const apiSliceWithDocuments = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getDocument: builder.query<DocumentType, string>({
      query: nodeID => `/documents/${nodeID}`,
      providesTags: (_result, _error, arg) => [{type: "Document", id: arg}]
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
    extractPages: builder.mutation<void, ExtractPagesType>({
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
      })
    })
  })
})

export const {
  useGetDocumentQuery,
  useGetPageImageQuery,
  useApplyPageOpChangesMutation,
  useMovePagesMutation,
  useExtractPagesMutation,
  useUpdateDocumentCustomFieldsMutation
} = apiSliceWithDocuments
