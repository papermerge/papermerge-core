import {apiSlice} from "@/features/api/slice"
import {
  DateFormatResponse,
  NumberFormatResponse,
  Preferences,
  TimestampFormatResponse,
  TimezoneResponse,
  UILanguageResponse
} from "@/features/preferences/types"

export const apiSliceWithPreferences = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getTimezones: builder.query<TimezoneResponse, void>({
      query: () => "/preferences/options/timezone",
      providesTags: ["PreferenceOptionTimezones"]
    }),
    getDateFormats: builder.query<DateFormatResponse, void>({
      query: () => "/preferences/options/date-format",
      providesTags: ["PreferenceOptionDateFormats"]
    }),
    getTimestampFormats: builder.query<TimestampFormatResponse, void>({
      query: () => "/preferences/options/timestamp-format",
      providesTags: ["PreferenceOptionTimestampFormats"]
    }),
    getNumberFormats: builder.query<NumberFormatResponse, void>({
      query: () => "/preferences/options/number-format",
      providesTags: ["PreferenceOptionNumberFormats"]
    }),
    getUILanguages: builder.query<UILanguageResponse, void>({
      query: () => "/preferences/options/ui-language",
      providesTags: ["PreferenceOptionNumberFormats"]
    }),
    updateMyPreferences: builder.mutation<Preferences, Partial<Preferences>>({
      query: preferences => ({
        url: "/preferences/me",
        method: "PATCH",
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
