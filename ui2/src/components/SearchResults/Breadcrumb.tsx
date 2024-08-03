import {Breadcrumbs, Anchor} from "@mantine/core"
import type {NType} from "@/types"

type Args = {
  items: Array<[string, string]>
  onClick: (n: NType) => void
}

export default function Path({items, onClick}: Args) {
  const links = items.map(i => (
    <Anchor onClick={() => onClick({id: i[0], ctype: "folder"})} key={i[0]}>
      {i[1]}
    </Anchor>
  ))
  return <Breadcrumbs>{links}</Breadcrumbs>
}
