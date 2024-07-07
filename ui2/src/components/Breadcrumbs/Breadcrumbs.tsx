import {useSelector} from "react-redux"
import {Breadcrumbs, Skeleton, Anchor} from "@mantine/core"

import {selectPanelBreadcrumbs} from "@/slices/dualPanel"
import type {PanelMode, NType} from "@/types"
import type {RootState} from "@/app/types"

type Args = {
  mode: PanelMode
  onClick: (node: NType) => void
}

export default function BreadcrumbsComponent({mode, onClick}: Args) {
  const items = useSelector<RootState>(state =>
    selectPanelBreadcrumbs(state, mode)
  ) as Array<[string, string]> | null | undefined

  if (!items) {
    return (
      <Skeleton width={"25%"} my="md">
        <Breadcrumbs>{["one", "two"]}</Breadcrumbs>
      </Skeleton>
    )
  }
  console.log(items)
  const links = items.slice(0, -1).map(i => (
    <Anchor key={i[0]} onClick={() => onClick({id: i[0], ctype: "folder"})}>
      {i[1]}
    </Anchor>
  ))
  const lastOne = items[items.length - 1][1]

  return (
    <>
      <Breadcrumbs>
        {links}
        {lastOne}
      </Breadcrumbs>
    </>
  )
}
