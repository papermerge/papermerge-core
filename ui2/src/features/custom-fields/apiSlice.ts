import {apiSlice} from "@/features/api/slice"
import type {
  CustomField,
  CustomFieldUpdate,
  NewCustomField,
  Paginated,
  PaginatedArgs
} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

export const apiSliceWithCustomFields = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedCustomFields: builder.query<
      Paginated<CustomField>,
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
          ret = `/custom-fields/?page_number=${page_number}`
          ret += `&page_size=${page_size}&order_by=${sort_by}`
          ret += `&filter=${filter}`
        } else {
          ret = `/custom-fields/?page_number=${page_number}`
          ret += `&page_size=${page_size}&order_by=${sort_by}`
        }

        return ret
      },
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        _arg
      ) => [
        "CustomField",
        ...result.items.map(({id}) => ({type: "CustomField", id}) as const)
      ]
    }),
    getCustomFields: builder.query<CustomField[], void>({
      query: _groups => "/custom-fields/all",
      providesTags: (result = [], _error, _arg) => [
        "CustomField",
        ...result.map(({id}) => ({type: "CustomField", id}) as const)
      ]
    }),
    getCustomField: builder.query<CustomField, string>({
      query: groupID => `/custom-fields/${groupID}`,
      providesTags: (_result, _error, arg) => [{type: "CustomField", id: arg}]
    }),
    addNewCustomField: builder.mutation<CustomField, NewCustomField>({
      query: cf => ({
        url: "/custom-fields/",
        method: "POST",
        body: cf
      }),
      invalidatesTags: ["CustomField"]
    }),
    editCustomField: builder.mutation<CustomField, CustomFieldUpdate>({
      query: cf => ({
        url: `custom-fields/${cf.id}`,
        method: "PATCH",
        body: cf
      }),
      invalidatesTags: (_result, _error, arg) => [
        {type: "CustomField", id: arg.id},
        "DocumentType"
      ]
    }),
    deleteCustomField: builder.mutation<void, string>({
      query: cfID => ({
        url: `custom-fields/${cfID}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [
        {type: "CustomField", id: id},
        "DocumentType"
      ]
    })
  })
})

export const {
  useGetPaginatedCustomFieldsQuery,
  useGetCustomFieldsQuery,
  useGetCustomFieldQuery,
  useEditCustomFieldMutation,
  useDeleteCustomFieldMutation,
  useAddNewCustomFieldMutation
} = apiSliceWithCustomFields
