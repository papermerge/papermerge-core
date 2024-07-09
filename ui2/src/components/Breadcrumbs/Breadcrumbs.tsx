import {useContext} from "react"
import {useSelector} from "react-redux"
import {Breadcrumbs, Skeleton, Anchor, Loader} from "@mantine/core"

import {
  selectPanelBreadcrumbs,
  selectPanelNodesStatus
} from "@/slices/dualPanel/dualPanel"
import type {PanelMode, NType} from "@/types"
import type {RootState} from "@/app/types"

import PanelContext from "@/contexts/PanelContext"

type Args = {
  onClick: (node: NType) => void
}

export default function BreadcrumbsComponent({onClick}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const nodesStatus = useSelector((state: RootState) =>
    selectPanelNodesStatus(state, mode)
  )

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
        {nodesStatus == "loading" && <Loader size={"sm"} />}
      </Breadcrumbs>
    </>
  )
}