import {RootState} from "@/app/types"
import {apiSlice} from "@/features/api/slice"
import {getBaseURL, getDefaultHeaders, imageEncode} from "@/utils"

export const apiSliceWithPages = apiSlice.injectEndpoints({
  endpoints: builder => ({
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
      }
    })
  })
})

export const {useGetPageImageQuery} = apiSliceWithPages
