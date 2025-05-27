import {apiSlice} from "@/features/api/slice"

interface ScheduleOCRProcessType {
  document_id: string
  lang: string
}

export const apiSliceWithTasks = apiSlice.injectEndpoints({
  endpoints: builder => ({
    scheduleOCRProcess: builder.mutation<void, ScheduleOCRProcessType>({
      query: data => ({
        url: "/tasks/ocr",
        method: "POST",
        body: data
      })
    })
  })
})

export const {useScheduleOCRProcessMutation} = apiSliceWithTasks
