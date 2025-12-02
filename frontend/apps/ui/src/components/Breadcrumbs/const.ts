import {BreadcrumbItemType, BreadcrumbType} from "@/types"

export const SHARED = "shared"
export const SHARED_ROOT_ITEM = [SHARED, SHARED] as BreadcrumbItemType
export const SHARED_FOLDER_BREADCRUMB = {
  root: SHARED,
  path: [SHARED_ROOT_ITEM]
} as BreadcrumbType
