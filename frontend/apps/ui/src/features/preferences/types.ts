export type UILanguageValue = "en" | "de"
export type DateFormatValue =
  | "YYYY-MM-DD"
  | "MM/DD/YYYY"
  | "MM/DD/YY"
  | "MMMM DD, YYYY"
  | "MMM DD, YYYY"
  | "DD/MM/YYYY"
  | "DD/MM/YY"
  | "DD.MM.YYYY"
  | "DD.MM.YY"
  | "DD-MM-YYYY"
  | "YYYY/MM/DD"
  | "YYYY.MM.DD"
  | "YYYYMMDD"

export type TimestampFormatValue =
  // ISO 8601 Formats
  | "YYYY-MM-DD HH:mm:ss"
  | "YYYY-MM-DD HH:mm:ss Z"
  | "YYYY-MM-DDTHH:mm:ss"
  | "YYYY-MM-DDTHH:mm:ssZ"

  // US Formats (12-hour)
  | "MM/DD/YYYY hh:mm:ss A"
  | "MM/DD/YY hh:mm A"
  | "MMM DD, YYYY hh:mm A"
  | "MMMM DD, YYYY hh:mm:ss A"

  // US Formats (24-hour)
  | "MM/DD/YYYY HH:mm:ss"
  | "MM/DD/YY HH:mm"
  | "MMM DD, YYYY HH:mm"
  | "MMMM DD, YYYY HH:mm:ss"

  // European Formats
  | "DD/MM/YYYY HH:mm:ss"
  | "DD/MM/YY HH:mm"
  | "DD.MM.YYYY HH:mm:ss"
  | "DD.MM.YYYY HH:mm"
  | "DD-MM-YYYY HH:mm:ss"

  // Asian Formats
  | "YYYY/MM/DD HH:mm:ss"
  | "YYYY/MM/DD HH:mm"

  // Compact
  | "YYYYMMDDHHmmss"

export type NumberFormatValue =
  | "us"
  | "eu_dot"
  | "eu_space"
  | "swiss"
  | "compact"

export type Preferences = {
  ui_language: string // de, en...
  timezone: string
  date_format: string
  number_format: string
  timestamp_format: string
  ui_theme: string // light / dark
  uploaded_document_lang: string
  search_lang: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface TimezoneResponse {
  timezones: SelectOption[]
}

export interface UILanguageResponse {
  languages: SelectOption[]
}

export interface DateFormatResponse {
  date_formats: SelectOption[]
}

export interface TimestampFormatResponse {
  timestamp_formats: SelectOption[]
}

export interface NumberFormatResponse {
  number_formats: SelectOption[]
}
