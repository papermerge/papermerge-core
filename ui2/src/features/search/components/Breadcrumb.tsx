import {selectCurrentUser} from "@/slices/currentUser"
import {equalUUIDs} from "@/utils"
import {Anchor, Breadcrumbs, Group, Skeleton} from "@mantine/core"
import {IconHome, IconInbox} from "@tabler/icons-react"
import {useSelector} from "react-redux"

import type {NType, UserDetails} from "@/types"

type Args = {
  items?: Array<[string, string]> | null
  pageNumber?: number | null
  onClick: (n: NType) => void
}

export default function Path({items, onClick, pageNumber}: Args) {
  if (!items) {
    return <Skeleton height={18} width={45} />
  }

  if (items.length == 0) {
    return <Skeleton height={18} width={45} />
  }

  if (items.length == 1) {
    return (
      <Breadcrumbs>
        <RootItem itemId={items[0][0]} onClick={onClick} />
        {pageNumber && pageNumber > 1 && `Page ${pageNumber}`}
      </Breadcrumbs>
    )
  }
  const links = items.slice(1).map(i => (
    <Anchor onClick={() => onClick({id: i[0], ctype: "folder"})} key={i[0]}>
      {i[1]}
    </Anchor>
  ))

  return (
    <Breadcrumbs>
      <RootItem itemId={items[0][0]} onClick={onClick} />
      {links}
      {pageNumber && pageNumber > 1 && `Page ${pageNumber}`}
    </Breadcrumbs>
  )
}

type RootItemArgs = {
  itemId: string
  onClick: (n: NType) => void
}

function RootItem({itemId, onClick}: RootItemArgs) {
  const user = useSelector(selectCurrentUser) as UserDetails | undefined

  const onLocalClick = (id: string) => {
    onClick({id: id, ctype: "folder"})
  }

  if (!user) {
    return <Skeleton>Home</Skeleton>
  }

  if (equalUUIDs(itemId, user.home_folder_id)) {
    return (
      <Anchor onClick={() => onLocalClick(user.home_folder_id)}>
        <Group>
          <IconHome />
          Home
        </Group>
      </Anchor>
    )
  }

  return (
    <Anchor onClick={() => onLocalClick(user.inbox_folder_id)}>
      <Group>
        <IconInbox />
        Inbox
      </Group>
    </Anchor>
  )
}
