export type BreadcrumbItemType = [string, string]
export type BreadcrumbRootType = "shared" | "inbox" | "home"

export type BreadcrumbType = {
  path: Array<BreadcrumbItemType>
  root: BreadcrumbRootType
}
