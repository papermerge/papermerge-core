import {useContext} from "react"
import {useSelector} from "react-redux"
import {
  Breadcrumbs,
  Skeleton,
  Anchor,
  Loader,
  Group,
  Menu,
  ActionIcon,
  MenuItem
} from "@mantine/core"
import {IconHome, IconInbox, IconChevronDown} from "@tabler/icons-react"
import classes from "./Breadcrumbs.module.css"

import {
  selectPanelBreadcrumbs,
  selectPanelNodesStatus
} from "@/slices/dualPanel/dualPanel"
import type {PanelMode, NType, UserDetails} from "@/types"
import type {RootState} from "@/app/types"

import PanelContext from "@/contexts/PanelContext"
import {selectCurrentUser} from "@/slices/currentUser"

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

  const onRootElementClick = (n: NType) => {
    onClick(n)
  }

  if (!items) {
    return (
      <Skeleton width={"25%"} my="md">
        <Breadcrumbs>{["one", "two"]}</Breadcrumbs>
      </Skeleton>
    )
  }

  const links = items.slice(1, -1).map(i => (
    <Anchor key={i[0]} onClick={() => onClick({id: i[0], ctype: "folder"})}>
      {i[1]}
    </Anchor>
  ))
  const lastOne = items[items.length - 1][1]

  if (items.length == 1) {
    return (
      <Group my={"lg"}>
        <Breadcrumbs className={classes.breadcrumbs}>
          <RootItem itemId={items[0][0]} onClick={onRootElementClick} />
        </Breadcrumbs>
        {nodesStatus == "loading" && <Loader size={"sm"} />}
      </Group>
    )
  }

  return (
    <Group my={"lg"}>
      <Breadcrumbs className={classes.breadcrumbs}>
        <RootItem itemId={items[0][0]} onClick={onRootElementClick} />
        {links}
        <Anchor>{lastOne}</Anchor>
      </Breadcrumbs>
      {nodesStatus == "loading" && <Loader size={"sm"} />}
    </Group>
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
      <Group>
        <Anchor onClick={() => onLocalClick(user.home_folder_id)}>
          <Group>
            <IconHome />
            Home
          </Group>
        </Anchor>
        <Menu shadow="md">
          <Menu.Target>
            <ActionIcon variant="default" size="sm">
              <IconChevronDown />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <MenuItem onClick={() => onLocalClick(user.inbox_folder_id)}>
              <Group>
                <IconInbox />
                Inbox
              </Group>
            </MenuItem>
          </Menu.Dropdown>
        </Menu>
      </Group>
    )
  }

  return (
    <Group>
      <Anchor onClick={() => onLocalClick(user.inbox_folder_id)}>
        <Group>
          <IconInbox /> Inbox
        </Group>
      </Anchor>
      <Menu shadow="md">
        <Menu.Target>
          <ActionIcon variant="default" size="sm">
            <IconChevronDown />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <MenuItem onClick={() => onLocalClick(user.home_folder_id)}>
            <Group>
              <IconHome />
              Home
            </Group>
          </MenuItem>
        </Menu.Dropdown>
      </Menu>
    </Group>
  )
}

function equalUUIDs(id1: string, id2: string): boolean {
  const i1 = id1.replace(/\-/g, "")
  const i2 = id2.replace(/\-/g, "")

  console.log(`${i1} == ${i2}`)
  return i1 == i2
}
