import {useContext, useEffect, useRef} from "react"
import {useSelector, useDispatch} from "react-redux"
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
import {useViewportSize} from "@mantine/hooks"
import {IconHome, IconInbox, IconChevronDown} from "@tabler/icons-react"
import classes from "./Breadcrumbs.module.css"

import {
  selectPanelBreadcrumbs,
  selectPanelNodesStatus
} from "@/slices/dualPanel/dualPanel"
import {updateBreadcrumb} from "@/slices/sizes"

import type {PanelMode, NType, UserDetails} from "@/types"
import type {RootState} from "@/app/types"

import PanelContext from "@/contexts/PanelContext"
import {selectCurrentUser} from "@/slices/currentUser"
import {equalUUIDs} from "@/utils"

type Args = {
  onClick: (node: NType) => void
  className?: string
}

export default function BreadcrumbsComponent({onClick, className}: Args) {
  const dispatch = useDispatch()
  const {height, width} = useViewportSize()
  const ref = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref?.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.marginBottom)
      value += parseInt(styles.paddingBottom)
      value += parseInt(styles.paddingTop)
      value += parseInt(styles.height)
      dispatch(updateBreadcrumb({mode, value}))
    }
  }, [width, height])

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
      <Group ref={ref} my={0} className={className}>
        <Breadcrumbs className={classes.breadcrumbs}>
          <RootItem itemId={items[0][0]} onClick={onRootElementClick} />
        </Breadcrumbs>
        {nodesStatus == "loading" && <Loader size={"sm"} />}
      </Group>
    )
  }

  return (
    <Group ref={ref} my={0} className={className}>
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
