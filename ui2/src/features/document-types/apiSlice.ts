import {apiSlice} from "@/features/api/slice"
import type {Paginated, PaginatedArgs} from "@/types"
import type {DocType, DocTypeUpdate, NewDocType} from "./types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithDocTypes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedDocumentTypes: builder.query<
      Paginated<DocType>,
      PaginatedArgs | void
    >({
      query: ({
        page_number = 1,
        page_size = PAGINATION_DEFAULT_ITEMS_PER_PAGES,
        sort_by = "name",
        filter = undefined
      }: PaginatedArgs) => {
        let ret

        if (filter) {
          ret = `/document-types/?page_number=${page_number}&page_size=${page_size}&order_by=${sort_by}`
          ret += `&filter=${filter}`
        } else {
          ret = `/document-types/?page_number=${page_number}&page_size=${page_size}&order_by=${sort_by}`
        }
        return ret
      },
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        _arg
      ) => [
        "DocumentType",
        ...result.items.map(({id}) => ({type: "DocumentType", id}) as const)
      ]
    }),
    getDocumentTypes: builder.query<DocType[], void>({
      query: _ => "/document-types/all",
      providesTags: (result = [], _error, _arg) => [
        "DocumentType",
        ...result.map(({id}) => ({type: "DocumentType", id}) as const)
      ]
    }),
    getDocumentType: builder.query<DocType, string>({
      query: docTypeID => `/document-types/${docTypeID}`,
      providesTags: (_result, _error, arg) => [{type: "DocumentType", id: arg}]
    }),
    addDocumentType: builder.mutation<DocType, NewDocType>({
      query: dt => ({
        url: "/document-types/",
        method: "POST",
        body: dt
      }),
      invalidatesTags: ["DocumentType"]
    }),
    editDocumentType: builder.mutation<DocType, DocTypeUpdate>({
      query: dt => ({
        url: `document-types/${dt.id}`,
        method: "PATCH",
        body: dt
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: "DocumentType", id: arg.id}
      ]
    }),
    deleteDocumentType: builder.mutation<void, string>({
      query: dtID => ({
        url: `document-types/${dtID}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [{type: "DocumentType", id: id}]
    })
  })
})

export const {
  useGetPaginatedDocumentTypesQuery,
  useGetDocumentTypesQuery,
  useGetDocumentTypeQuery,
  useEditDocumentTypeMutation,
  useDeleteDocumentTypeMutation,
  useAddDocumentTypeMutation
} = apiSliceWithDocTypes
