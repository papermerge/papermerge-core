import {apiSlice} from "@/features/api/slice"
import {
  Preferences,
  SelectOption,
  TimezoneResponse,
  UILanguageResponse
} from "@/features/preferences/types"

export const apiSliceWithPreferences = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getTimezones: builder.query<TimezoneResponse, void>({
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
    getUILanguages: builder.query<UILanguageResponse, void>({
      query: () => "/preferences/options/ui-language",
      providesTags: ["PreferenceOptionNumberFormats"]
    }),
    updateMyPreferences: builder.mutation<Preferences, Partial<Preferences>>({
      query: preferences => ({
        url: "/preferences/me",
        method: "PUT",
        body: preferences
      })
    })
  })
})

export const {
  useGetTimezonesQuery,
  useLazyGetTimezonesQuery,
  useGetDateFormatsQuery,
  useGetNumberFormatsQuery,
  useGetTimestampFormatsQuery,
  useGetUILanguagesQuery,
  useUpdateMyPreferencesMutation
} = apiSliceWithPreferences
