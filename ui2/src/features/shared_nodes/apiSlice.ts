import {apiSlice} from "@/features/api/slice"

import {NewSharedNodes} from "@/types.d/shared_nodes"

export const apiSliceWithSharedNodes = apiSlice.injectEndpoints({
  endpoints: builder => ({
    addNewSharedNode: builder.mutation<void, NewSharedNodes>({
      query: shared_node => ({
        url: "/shared-nodes/",
        method: "POST",
        body: shared_node
      })
    })
  })
})

export const {useAddNewSharedNodeMutation} = apiSliceWithSharedNodes
