import {DocumentType} from "@/types"
import {apiSlice} from "@/features/api/slice"

export const apiSliceWithDocuments = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getDocument: builder.query<DocumentType, string>({
      query: nodeID => `/documents/${nodeID}`,
      providesTags: (_result, _error, arg) => [{type: "Document", id: arg}]
    })
  })
})

export const {useGetDocumentQuery} = apiSliceWithDocuments
