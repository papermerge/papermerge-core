import {apiSlice} from "@/features/api/slice"
import type {
  CustomFieldItem,
  CustomFieldQueryParams
} from "@/features/custom-fields/types"
import type {
  CustomField,
  CustomFieldUpdate,
  NewCustomField,
  Owner,
  Paginated
} from "@/types"

import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"

interface GetCustomFieldsArgs {
  owner?: Owner
  document_type_id?: string | null
}

export const apiSliceWithCustomFields = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedCustomFields: builder.query<
      Paginated<CustomFieldItem>,
      CustomFieldQueryParams | void
    >({
      query: (params = {}) => {
        const queryString = buildQueryString(params || {})
        return `/custom-fields/?${queryString}`
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
        _arg
      ) => [
        "CustomField",
        ...result.items.map(({id}) => ({type: "CustomField", id}) as const)
      ]
    }),
    getCustomFields: builder.query<CustomField[], GetCustomFieldsArgs>({
      query: ({owner, document_type_id}: GetCustomFieldsArgs) => {
        const params = new URLSearchParams()

        if (document_type_id) {
          params.append("document_type_id", document_type_id)
        }

        if (owner?.type === "group") {
          params.append("group_id", owner.id.toString())
        } else if (owner?.type === "user") {
          params.append("user_id", owner.id.toString())
        }

        return `/custom-fields/all?${params.toString()}`
      },
      providesTags: (result = [], _error, _arg) => [
        "CustomField",
        ...result.map(({id}) => ({type: "CustomField", id}) as const)
      ]
    }),
    getCustomField: builder.query<CustomFieldItem, string>({
      query: groupID => `/custom-fields/${groupID}`,
      providesTags: (_result, _error, arg) => [{type: "CustomField", id: arg}]
    }),
    addNewCustomField: builder.mutation<CustomFieldItem, NewCustomField>({
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

function buildQueryString(params: CustomFieldQueryParams = {}): string {
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

  if (params.filter_types) {
    searchParams.append("filter_types", params.filter_types)
  }

  return searchParams.toString()
}
