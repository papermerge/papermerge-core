type BreadcrumbItem = [string, string] // [id, title]

type Args = {
  items: BreadcrumbItem[]
  maxItems?: number
  maxTotalLength?: number
  maxItemLength?: number
}

type TruncationResult = {
  needsTruncation: boolean
  wouldHideItems: boolean
  startItems: BreadcrumbItem[]
  endItems: BreadcrumbItem[]
  fullPath: string
  itemsToShowAtStart: number
  itemsToShowAtEnd: number
}

function truncateTitle(title: string, maxLength: number): string {
  if (title.length <= maxLength) {
    return title
  }
  return title.slice(0, maxLength - 1) + "…"
}

export function useBreadcrumbLinks({
  items,
  maxItems = 4,
  maxTotalLength = 60,
  maxItemLength = 30
}: Args): TruncationResult & {
  items: BreadcrumbItem[]
  maxItemLength: number
  truncateTitle: (title: string) => string
} {
  const totalLength = items.reduce((sum, item) => sum + item[1].length, 0)
  const needsTruncation =
    items.length > maxItems || totalLength > maxTotalLength

  const itemsToShowAtEnd = Math.max(1, Math.floor((maxItems - 1) / 2))
  const itemsToShowAtStart = Math.max(1, maxItems - 1 - itemsToShowAtEnd)
  const wouldHideItems = items.length > itemsToShowAtStart + itemsToShowAtEnd

  const startItems = items.slice(0, itemsToShowAtStart)
  const endItems = items.slice(-itemsToShowAtEnd)
  const fullPath = items.map(([, title]) => title).join(" / ")

  return {
    items,
    needsTruncation,
    wouldHideItems,
    startItems,
    endItems,
    fullPath,
    itemsToShowAtStart,
    itemsToShowAtEnd,
    maxItemLength,
    truncateTitle: (title: string) => truncateTitle(title, maxItemLength)
  }
}
