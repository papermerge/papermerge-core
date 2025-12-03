import {Breadcrumbs, Group, Loader, Skeleton} from "@mantine/core"
import {useRef} from "react"
import classes from "./Breadcrumbs.module.css"

import type {BreadcrumbType, NType} from "@/types"
import BreadcrumbLinks from "./BreadcrumbLinks"
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
        <BreadcrumbLinks items={middleAndLastItems} onClick={onClick} />
      </Breadcrumbs>
      {isFetching && <Loader size={"sm"} />}
    </Group>
  )
}
