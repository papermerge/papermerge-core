import {apiSlice} from "@/features/api/slice"

interface Version {
  version: string
}

export const apiSliceWithVersion = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getVersion: builder.query<Version, void>({
      query: () => "/version/"
    })
  })
})

export const {useGetVersionQuery} = apiSliceWithVersion
