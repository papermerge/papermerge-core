import type {BreadcrumbType} from "@/types"
import {SHARED, SHARED_FOLDER_BREADCRUMB, SHARED_ROOT_ITEM} from "./const"

/* There is physical shared folder i.e. shared folder
does not have an ID -> "shared" literal is used intead

In case of document retrieved via shared folders, BE returns breadcrumb
without "shared folder" -> thus it is inserted here
*/
export function getSharedFolderBreadcrumb(
  breadcrumb?: BreadcrumbType
): BreadcrumbType {
  if (!breadcrumb) {
    return SHARED_FOLDER_BREADCRUMB
  }

  if (breadcrumb.root == SHARED) {
    const newValue = {
      root: breadcrumb.root,
      path: [SHARED_ROOT_ITEM, ...breadcrumb.path]
    }

    return newValue
  }

  return breadcrumb
}
