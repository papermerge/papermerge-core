import {Anchor, Group, Tooltip} from "@mantine/core"
import {IconDots} from "@tabler/icons-react"
import type {ReactNode} from "react"

import type {NType} from "@/types"
import {useBreadcrumbLinks} from "./useBreadcrumbLinks"

type BreadcrumbItem = [string, string] // [id, title]

type Args = {
  items: BreadcrumbItem[]
  onClick: (node: NType) => void
  maxItems?: number
  maxTotalLength?: number
  maxItemLength?: number
}

export default function BreadcrumbLinks({
  items,
  onClick,
  maxItems = 4,
  maxTotalLength = 60,
  maxItemLength = 30
}: Args): ReactNode[] {
  const {
    needsTruncation,
    wouldHideItems,
    startItems,
    endItems,
    fullPath,
    truncateTitle
  } = useBreadcrumbLinks({items, maxItems, maxTotalLength, maxItemLength})

  if (items.length === 0) {
    return []
  }

  if (!needsTruncation) {
    return [
      ...items.slice(0, -1).map(([id, title]) => (
        <Anchor key={id} onClick={() => onClick({id, ctype: "folder"})}>
          {title}
        </Anchor>
      )),
      <Anchor key={items[items.length - 1][0]}>
        {items[items.length - 1][1]}
      </Anchor>
    ]
  }

  if (!wouldHideItems) {
    return [
      ...items.slice(0, -1).map(([id, title]) => {
        const truncated = truncateTitle(title)
        const needsTooltip = truncated !== title
        const anchor = (
          <Anchor key={id} onClick={() => onClick({id, ctype: "folder"})}>
            {truncated}
          </Anchor>
        )
        return needsTooltip ? (
          <Tooltip key={id} label={title}>
            {anchor}
          </Tooltip>
        ) : (
          anchor
        )
      }),
      (() => {
        const [id, title] = items[items.length - 1]
        const truncated = truncateTitle(title)
        const needsTooltip = truncated !== title
        const anchor = <Anchor key={id}>{truncated}</Anchor>
        return needsTooltip ? (
          <Tooltip key={id} label={fullPath} multiline maw={300}>
            {anchor}
          </Tooltip>
        ) : (
          anchor
        )
      })()
    ]
  }

  return [
    ...startItems.map(([id, title]) => (
      <Anchor key={id} onClick={() => onClick({id, ctype: "folder"})}>
        {truncateTitle(title)}
      </Anchor>
    )),
    <Tooltip key="ellipsis" label={fullPath} multiline maw={300}>
      <Group gap={0} style={{cursor: "default"}}>
        <IconDots size={16} />
      </Group>
    </Tooltip>,
    ...endItems.map(([id, title], index) => {
      const isLast = index === endItems.length - 1
      return (
        <Anchor
          key={id}
          onClick={isLast ? undefined : () => onClick({id, ctype: "folder"})}
        >
          {truncateTitle(title)}
        </Anchor>
      )
    })
  ]
}
