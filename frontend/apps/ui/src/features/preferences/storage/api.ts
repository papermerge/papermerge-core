import {apiSlice} from "@/features/api/slice"
import {SelectOption} from "@/features/preferences/types"

export const apiSliceWithPreferences = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getTimezones: builder.query<SelectOption[], void>({
      query: () => "/preferences/options/timezone",
      providesTags: ["PreferenceOptionTimezones"]
    }),
    getDateFormats: builder.query<SelectOption[], void>({
      query: () => "/preferences/options/date-formats",
      providesTags: ["PreferenceOptionDateFormats"]
    }),
    getTimestampFormats: builder.query<SelectOption[], void>({
      query: () => "/preferences/options/timestamp-formats",
      providesTags: ["PreferenceOptionTimestampFormats"]
    }),
    getNumberFormats: builder.query<SelectOption[], void>({
      query: () => "/preferences/options/number-formats",
      providesTags: ["PreferenceOptionNumberFormats"]
    }),
    getUILanguages: builder.query<SelectOption[], void>({
      query: () => "/preferences/options/number-formats",
      providesTags: ["PreferenceOptionNumberFormats"]
    })
  })
})

export const {
  useGetTimezonesQuery,
  useGetDateFormatsQuery,
  useGetNumberFormatsQuery,
  useGetTimestampFormatsQuery,
  useLazyGetUILanguagesQuery
} = apiSliceWithPreferences
