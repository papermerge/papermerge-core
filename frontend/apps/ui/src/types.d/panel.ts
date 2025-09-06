import {SortState} from "kommon"

export interface PanelListBase {
  freeTextFilterValue?: string
  pageNumber?: number
  pageSize?: number
  sorting?: SortState
  visibleColumns?: Array<string>
}
