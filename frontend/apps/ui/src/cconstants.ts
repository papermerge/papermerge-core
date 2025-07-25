import { CustomFieldDataType, I18nLangType, OCRLangType } from "@/types"

export const DEFAULT_TAG_BG_COLOR = "#c41fff"
export const DEFAULT_TAG_FG_COLOR = "#ffffff"
// ID of the DOM element where modals are created
export const MODALS = "modals" // ID of the DOM element
export const DATA_TYPE_NODES = "type/nodes"
export const DATA_TRANSFER_EXTRACTED_PAGES = "type/extracted-pages"

export const OCR_LANG: OCRLangType = {
  ces: "Čeština",
  dan: "Dansk",
  deu: "Deutsch",
  ell: "Ελληνικά",
  eng: "English",
  fin: "Suomi",
  fra: "Français",
  guj: "ગુજરાતી",
  heb: "עברית",
  hin: "हिंदी",
  ita: "Italiano",
  jpn: "日本語",
  kor: "한국어",
  lit: "Lietuvių",
  nld: "Nederlands",
  nor: "Norsk",
  osd: "Osd",
  pol: "Polski",
  por: "Português",
  ron: "Română",
  san: "संस्कृत",
  spa: "Español",
  kaz: "Қазақша",
  rus: "Русский"
}

export const HIDDEN = {
  // far away coordinates
  x: -100000,
  y: -100000
}

export const PAGINATION_DEFAULT_ITEMS_PER_PAGES = 10
export const STORAGE_KEY_PAGINATION_MITEMS_PER_PAGE = "mitems_per_page"
export const STORAGE_KEY_PAGINATION_SITEMS_PER_PAGE = "sitems_per_page"

export const PAGINATION_PAGE_SIZES = ["5", "10", "15", "25", "50"]
export const INITIAL_PAGE_SIZE = 5
export const ZOOM_FACTOR_INIT = 100
export const ZOOM_FACTOR_STEP = 10 // percents
export const MIN_ZOOM_FACTOR = 25 // percents
export const MAX_ZOOM_FACTOR = 300 // percents

export const ONE_DAY_IN_SECONDS = 86400
export const DRAGGED = "dragged"

export const CUSTOM_FIELD_DATA_TYPES: Array<CustomFieldDataType> = [
  "boolean",
  "date",
  "float",
  "int",
  "monetary",
  "text",
  "yearmonth"
]

export const CURRENCIES = [
  "CHF",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HUF",
  "ISK",
  "NOK",
  "USD",
  "RON",
  "RUB",
  "SEK",
  "THB",
  "TL"
]

export const OWNER_ME = "me"
export const SHARED_FOLDER_ROOT_ID = "shared"
export const SHARED_FOLDER_ROOT_NAME = "Shared"
export const SHARED_NODES_ROOT_BREADCRUMB = [
  [SHARED_FOLDER_ROOT_ID, SHARED_FOLDER_ROOT_NAME]
]

export const SUPPORTED_LANGS: I18nLangType[] = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "ru", name: "Русский" },
  { code: "kk", name: "Қазақша" }
]

export const ERRORS_422_UNPROCESSABLE_CONTENT = "/errors/unprocessable-content"
export const ERRORS_404_RESOURCE_NOT_FOUND = "/errors/resource-not-found"
export const ERRORS_403_ACCESS_FORBIDDEN = "/errors/access-forbidden"

export const IMAGE_SIZE_MAP = {
  "sm": 200,
  "md": 800,
  "lg": 1000,
  "xl": 1200
}
