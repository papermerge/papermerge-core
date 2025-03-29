import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  ActionIcon,
  Anchor,
  Breadcrumbs,
  Group,
  Loader,
  Menu,
  MenuItem,
  Skeleton
} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {IconChevronDown, IconHome, IconInbox} from "@tabler/icons-react"
import {useContext, useEffect, useRef} from "react"
import classes from "./Breadcrumbs.module.css"

import {updateBreadcrumb} from "@/features/ui/uiSlice"

import type {NType, PanelMode, UserDetails} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {lastHomeUpdated, lastInboxUpdated} from "@/features/ui/uiSlice"
import {
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery
} from "@/features/users/apiSlice"
import {selectCurrentUser} from "@/slices/currentUser"
import {equalUUIDs} from "@/utils"

type Args = {
  onClick: (node: NType) => void
  className?: string
  breadcrumb?: Array<[string, string]>
  isFetching?: boolean
}

export default function BreadcrumbsComponent({
  onClick,
  className,
  breadcrumb,
  isFetching
}: Args) {
  const dispatch = useAppDispatch()
  const {height, width} = useViewportSize()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)

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
        <Anchor>{lastOne}</Anchor>
      </Breadcrumbs>
      {isFetching && <Loader size={"sm"} />}
    </Group>
  )
}

type RootItemArgs = {
  itemId: string
  onClick: (n: NType) => void
}

type RootType = "home" | "inbox"

function RootItem({itemId, onClick}: RootItemArgs) {
  const user = useAppSelector(selectCurrentUser) as UserDetails | undefined
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()

  const {data: inboxes, isLoading: inboxesAreLoading} =
    useGetUserGroupInboxesQuery()
  const {data: homes, isLoading: homesAreLoading} = useGetUserGroupHomesQuery()
  let root_type: RootType = "home"
  let currentID = itemId
  let currentLabel = "My"

  const onLocalClick = (id: string, label: string, root_type: RootType) => {
    onClick({id: id, ctype: "folder"})
    if (root_type == "inbox") {
      dispatch(
        lastInboxUpdated({
          mode: mode,
          last_inbox: {
            label: label,
            inbox_id: id
          }
        })
      )
    } else {
      dispatch(
        lastHomeUpdated({
          mode: mode,
          last_home: {
            label: label,
            home_id: id
          }
        })
      )
    }
  }

  if (!user || inboxesAreLoading || homesAreLoading || !homes || !inboxes) {
    return <Skeleton>XXXX</Skeleton>
  }

  if (equalUUIDs(itemId, user.home_folder_id)) {
    root_type = "home"
    currentLabel = "My Home"
    currentID = user.home_folder_id
  } else if (equalUUIDs(itemId, user.inbox_folder_id)) {
    root_type = "inbox"
    currentLabel = "My Inbox"
    currentID = user.inbox_folder_id
  } else if (homes.find(i => equalUUIDs(i.home_id, itemId))) {
    const ho = homes.find(i => equalUUIDs(i.home_id, itemId))
    root_type = "home"
    if (ho) {
      currentLabel = `${ho?.group_name} Home`
      currentID = ho.home_id
    }
  } else if (inboxes.find(i => equalUUIDs(i.inbox_id, itemId))) {
    const inb = inboxes.find(i => equalUUIDs(i.inbox_id, itemId))
    root_type = "inbox"
    if (inb) {
      currentLabel = `${inb?.group_name} Inbox`
      currentID = inb.inbox_id
    }
  }

  const homes_components = homes.map(i => (
    <MenuItem
      onClick={() => onLocalClick(i.home_id, `${i.group_name} Home`, root_type)}
    >
      <Group>
        <IconHome /> {i.group_name}
      </Group>
    </MenuItem>
  ))
  const inbox_components = inboxes.map(i => (
    <MenuItem
      onClick={() =>
        onLocalClick(i.inbox_id, `${i.group_name} Inbox`, root_type)
      }
    >
      <Group>
        <IconInbox />
        {i.group_name}
      </Group>
    </MenuItem>
  ))
  const homes_and_inboxes_dropdown_component = [
    <Menu.Label>
      <Group>Home</Group>
    </Menu.Label>,
    <MenuItem
      onClick={() => onLocalClick(user.home_folder_id, "My", root_type)}
    >
      <Group>
        <IconHome />
        My
      </Group>
    </MenuItem>,
    ...homes_components,
    <Menu.Divider />,
    <Menu.Label>
      <Group>Inbox</Group>
    </Menu.Label>,
    <MenuItem
      onClick={() => onLocalClick(user.inbox_folder_id, "My Inbox", root_type)}
    >
      <Group>
        <IconInbox /> My
      </Group>
    </MenuItem>,
    ...inbox_components
  ]

  if (root_type == "home") {
    return (
      <Group>
        <Anchor
          onClick={() => onLocalClick(currentID, currentLabel, root_type)}
        >
          <Group>
            <IconHome />
            {currentLabel}
          </Group>
        </Anchor>
        <Menu shadow="md">
          <Menu.Target>
            <ActionIcon variant="default" size="sm">
              <IconChevronDown />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>{homes_and_inboxes_dropdown_component}</Menu.Dropdown>
        </Menu>
      </Group>
    )
  }

  return (
    <Group>
      <Anchor onClick={() => onLocalClick(currentID, currentLabel, root_type)}>
        <Group>
          <IconInbox /> {currentLabel}
        </Group>
      </Anchor>
      <Menu shadow="md">
        <Menu.Target>
          <ActionIcon variant="default" size="sm">
            <IconChevronDown />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>{homes_and_inboxes_dropdown_component}</Menu.Dropdown>
      </Menu>
    </Group>
  )
}
