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
import {selectLastHome, selectLastInbox} from "@/features/ui/uiSlice"
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

function RootItem({itemId, onClick}: RootItemArgs) {
  const user = useAppSelector(selectCurrentUser) as UserDetails | undefined
  const mode: PanelMode = useContext(PanelContext)
  const lastHome = useAppSelector(s => selectLastHome(s, mode))
  const lastInbox = useAppSelector(s => selectLastInbox(s, mode))
  let homeLabel = "Home"
  let inboxLabel = "Inbox"

  const onLocalClick = (id: string) => {
    onClick({id: id, ctype: "folder"})
  }

  if (!user) {
    return <Skeleton>XXXX</Skeleton>
  }

  if (equalUUIDs(itemId, lastHome?.home_id || user.home_folder_id)) {
    if (lastHome?.home_id == user.home_folder_id) {
      homeLabel = "My Home"
    } else if (itemId == user.home_folder_id) {
      homeLabel = "My Home"
    } else if (lastHome?.label) {
      homeLabel = `${lastHome?.label} Home`
    }
  }

  if (equalUUIDs(itemId, lastInbox?.inbox_id || user.inbox_folder_id)) {
    if (lastInbox?.inbox_id == user.inbox_folder_id) {
      inboxLabel = "My Inbox"
    } else if (itemId == user.inbox_folder_id) {
      inboxLabel = "My Inbox"
    } else if (lastInbox?.label) {
      inboxLabel = `${lastInbox?.label} Inbox`
    }
  }

  if (equalUUIDs(itemId, lastHome?.home_id || user.home_folder_id)) {
    return (
      <Group>
        <Anchor
          onClick={() => onLocalClick(lastHome?.home_id || user.home_folder_id)}
        >
          <Group>
            <IconHome />
            {homeLabel}
          </Group>
        </Anchor>
        <Menu shadow="md">
          <Menu.Target>
            <ActionIcon variant="default" size="sm">
              <IconChevronDown />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <MenuItem
              onClick={() =>
                onLocalClick(lastInbox?.inbox_id || user.inbox_folder_id)
              }
            >
              <Group>
                <IconInbox />
                {inboxLabel}
              </Group>
            </MenuItem>
          </Menu.Dropdown>
        </Menu>
      </Group>
    )
  }

  return (
    <Group>
      <Anchor
        onClick={() =>
          onLocalClick(lastInbox?.inbox_id || user.inbox_folder_id)
        }
      >
        <Group>
          <IconInbox /> {inboxLabel}
        </Group>
      </Anchor>
      <Menu shadow="md">
        <Menu.Target>
          <ActionIcon variant="default" size="sm">
            <IconChevronDown />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <MenuItem
            onClick={() =>
              onLocalClick(lastHome?.home_id || user.home_folder_id)
            }
          >
            <Group>
              <IconHome />
              {homeLabel}
            </Group>
          </MenuItem>
        </Menu.Dropdown>
      </Menu>
    </Group>
  )
}
