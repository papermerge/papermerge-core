import {useContext, useEffect, useRef} from "react"
import {useAppSelector, useAppDispatch} from "@/app/hooks"
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

import {updateBreadcrumb} from "@/features/ui/uiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"

import type {PanelMode, NType, UserDetails} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {selectCurrentUser} from "@/slices/currentUser"
import {equalUUIDs} from "@/utils"
import {useGetFolderQuery} from "@/features/nodes/apiSlice"

type Args = {
  onClick: (node: NType) => void
  className?: string
}

export default function BreadcrumbsComponent({onClick, className}: Args) {
  const dispatch = useAppDispatch()
  const {height, width} = useViewportSize()
  const ref = useRef<HTMLDivElement>(null)
  const mode: PanelMode = useContext(PanelContext)
  //const nodesStatus = useAppSelector(s => selectPanelNodesStatus(s, mode))
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))

  const {data, isLoading} = useGetFolderQuery(currentNodeID!)

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

  if (isLoading || !data) {
    return (
      <Skeleton ref={ref} width={"25%"} my="md">
        <Breadcrumbs>{["one", "two"]}</Breadcrumbs>
      </Skeleton>
    )
  }

  const items = data.breadcrumb
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
        {/*nodesStatus == "loading" && <Loader size={"sm"} />*/}
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
      {/*nodesStatus == "loading" && <Loader size={"sm"} />*/}
    </Group>
  )
}

type RootItemArgs = {
  itemId: string
  onClick: (n: NType) => void
}

function RootItem({itemId, onClick}: RootItemArgs) {
  const user = useAppSelector(selectCurrentUser) as UserDetails | undefined

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
