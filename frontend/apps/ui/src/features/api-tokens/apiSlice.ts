import {apiSlice} from "@/features/api/slice"
import type {
  APIToken,
  APITokenCreated,
  CreateAPITokenRequest,
  DeleteAPITokenResponse
} from "./types"

export const apiSliceWithTokens = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getAPITokens: builder.query<APIToken[], void>({
      query: () => "/tokens",
      providesTags: result =>
        result
          ? [
              ...result.map(({id}) => ({type: "APIToken" as const, id})),
              {type: "APIToken", id: "LIST"}
            ]
          : [{type: "APIToken", id: "LIST"}]
    }),

    createAPIToken: builder.mutation<APITokenCreated, CreateAPITokenRequest>({
      query: data => ({
        url: "/tokens",
        method: "POST",
        body: data
      }),
      invalidatesTags: [{type: "APIToken", id: "LIST"}]
    }),

    deleteAPIToken: builder.mutation<DeleteAPITokenResponse, string>({
      query: tokenId => ({
        url: `/tokens/${tokenId}`,
        method: "DELETE"
      }),
      invalidatesTags: (_result, _error, id) => [
        {type: "APIToken", id},
        {type: "APIToken", id: "LIST"}
      ]
    })
  })
})

export const {
  useGetAPITokensQuery,
  useCreateAPITokenMutation,
  useDeleteAPITokenMutation
} = apiSliceWithTokens
