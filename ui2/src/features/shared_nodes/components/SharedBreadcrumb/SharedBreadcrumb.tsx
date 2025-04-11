import type {NType} from "@/types"
import {Anchor, Breadcrumbs, Group, Loader, Skeleton} from "@mantine/core"
import {useRef} from "react"
import classes from "./Breadcrumbs.module.css"

interface Args {
  onClick: (node: NType) => void
  className?: string
  breadcrumb?: Array<[string, string]>
  isFetching?: boolean
}

export default function SharedBreadcrumb({
  breadcrumb,
  className,
  isFetching,
  onClick
}: Args) {
  const ref = useRef<HTMLDivElement>(null)

  if (!breadcrumb) {
    return (
      <Skeleton ref={ref} width={"25%"} my="md">
        <Breadcrumbs>{["one", "two"]}</Breadcrumbs>
      </Skeleton>
    )
  }

  const items = breadcrumb
  const links = items.slice(1, -1).map(i => (
    <Anchor key={i[0]} onClick={() => onClick({id: i[0], ctype: "folder"})}>
      {i[1]}
    </Anchor>
  ))
  const lastOne = items[items.length - 1][1]

  return (
    <Group ref={ref} my={0} className={className}>
      <Breadcrumbs className={classes.breadcrumbs}>
        {links}
        <Anchor>{lastOne}</Anchor>
      </Breadcrumbs>
      {isFetching && <Loader size={"sm"} />}
    </Group>
  )
}
