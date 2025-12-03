import {Breadcrumbs, Group, Loader, Skeleton} from "@mantine/core"
import {useRef} from "react"
import classes from "./Breadcrumbs.module.css"

import type {BreadcrumbType, NType} from "@/types"
import getBreadcrumbLinks from "./BreadcrumbLinks"
import RootItem from "./RootItem"

type Args = {
  onClick: (node: NType) => void
  className?: string
  breadcrumb?: BreadcrumbType
  isFetching?: boolean
}

export default function BreadcrumbsComponent({
  onClick,
  className,
  breadcrumb,
  isFetching
}: Args) {
  const ref = useRef<HTMLDivElement>(null)

  const onRootElementClick = (n: NType) => {
    onClick(n)
  }

  if (!breadcrumb || isFetching) {
    return (
      <Skeleton width={"25%"} my="md">
        <Breadcrumbs>{["one", "two"]}</Breadcrumbs>
      </Skeleton>
    )
  }

  const items = breadcrumb.path

  const middleAndLastItems = items.slice(1)
  /**
   * When working with components like Mantine's <Breadcrumbs> that
   * add separators between children, you need to return an array of
   * elements rather than wrap them in a component. Otherwise they appear as a single
   * child and no separators are added.
   */
  const links = getBreadcrumbLinks({items: middleAndLastItems, onClick}) // It needs to return an array!

  if (items.length == 1) {
    return (
      <Group ref={ref} my={0} className={className}>
        <Breadcrumbs className={classes.breadcrumbs}>
          <RootItem itemId={items[0][0]} onClick={onRootElementClick} />
        </Breadcrumbs>
        {isFetching && <Loader size={"sm"} />}
      </Group>
    )
  }

  return (
    <Group ref={ref} my={0} className={className}>
      <Breadcrumbs className={classes.breadcrumbs}>
        <RootItem itemId={items[0][0]} onClick={onRootElementClick} />
        {links}
      </Breadcrumbs>
      {isFetching && <Loader size={"sm"} />}
    </Group>
  )
}
