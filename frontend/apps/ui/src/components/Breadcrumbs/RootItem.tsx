import {useAppSelector} from "@/app/hooks"
import {Badge, Group, Loader, Menu, Skeleton} from "@mantine/core"
import {
  IconChevronDown,
  IconHome,
  IconInbox,
  IconShare,
  IconUser,
  IconUsers
} from "@tabler/icons-react"
import {useState} from "react"

import type {
  BreadcrumbRootType,
  GroupHome,
  GroupInbox,
  NType,
  UserDetails
} from "@/types"

import {
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery
} from "@/features/users/storage/api"
import {selectCurrentUser} from "@/slices/currentUser"
import {equalUUIDs} from "@/utils"
import {useTranslation} from "react-i18next"

type RootItemArgs = {
  itemId: string
  onClick: (n: NType) => void
}

type RootContext = {
  type: "personal" | "group"
  groupName?: string
  rootType: BreadcrumbRootType
  folderId: string
}

export default function RootItem({itemId, onClick}: RootItemArgs) {
  const {t} = useTranslation()
  const user = useAppSelector(selectCurrentUser) as UserDetails | undefined
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Lazy load - only fetch when dropdown is opened
  const {
    data: inboxes,
    isLoading: inboxesAreLoading,
    error: inboxesError
  } = useGetUserGroupInboxesQuery(undefined, {
    skip: !isDropdownOpen
  })

  const {
    data: homes,
    isLoading: homesAreLoading,
    error: homesError
  } = useGetUserGroupHomesQuery(undefined, {
    skip: !isDropdownOpen
  })

  const handleDropdownOpen = () => {
    setIsDropdownOpen(true)
  }

  const onLocalClick = (folderId: string) => {
    onClick({id: folderId, ctype: "folder"})
  }

  // Determine current context from itemId
  const getCurrentContext = (): RootContext | null => {
    if (!user) return null

    // Check personal folders
    if (equalUUIDs(itemId, user.home_folder_id)) {
      return {
        type: "personal",
        rootType: "home",
        folderId: user.home_folder_id
      }
    }

    if (equalUUIDs(itemId, user.inbox_folder_id)) {
      return {
        type: "personal",
        rootType: "inbox",
        folderId: user.inbox_folder_id
      }
    }

    if (itemId === "shared") {
      return {
        type: "personal",
        rootType: "shared",
        folderId: "shared"
      }
    }

    // Check group homes (only if data is loaded)
    if (homes) {
      const groupHome = homes.find(h => equalUUIDs(h.home_id, itemId))
      if (groupHome) {
        return {
          type: "group",
          groupName: groupHome.group_name,
          rootType: "home",
          folderId: groupHome.home_id
        }
      }
    }

    // Check group inboxes (only if data is loaded)
    if (inboxes) {
      const groupInbox = inboxes.find(i => equalUUIDs(i.inbox_id, itemId))
      if (groupInbox) {
        return {
          type: "group",
          groupName: groupInbox.group_name,
          rootType: "inbox",
          folderId: groupInbox.inbox_id
        }
      }
    }

    // Default fallback - try to determine from the item itself
    // This handles the case before lazy data is loaded
    return null
  }

  const context = getCurrentContext()

  // Build the display label for the badge
  const getBadgeLabel = (): {ownerLabel: string; folderLabel: string} => {
    if (!context) {
      // Fallback when context can't be determined yet
      return {
        ownerLabel: t("common.personal", {defaultValue: "Personal"}),
        folderLabel: t("common.home", {defaultValue: "Home"})
      }
    }

    const ownerLabel =
      context.type === "personal"
        ? t("common.personal", {defaultValue: "Personal"})
        : context.groupName || ""

    let folderLabel: string
    switch (context.rootType) {
      case "home":
        folderLabel = t("common.home", {defaultValue: "Home"})
        break
      case "inbox":
        folderLabel = t("common.Inbox", {defaultValue: "Inbox"})
        break
      case "shared":
        folderLabel = t("common.shared", {defaultValue: "Shared"})
        break
      default:
        folderLabel = t("common.home", {defaultValue: "Home"})
    }

    return {ownerLabel, folderLabel}
  }

  const {ownerLabel, folderLabel} = getBadgeLabel()

  // Get icon for root type
  const getRootIcon = () => {
    if (!context) return <IconHome size={16} />

    switch (context.rootType) {
      case "home":
        return <IconHome size={16} />
      case "inbox":
        return <IconInbox size={16} />
      case "shared":
        return <IconShare size={16} />
      default:
        return <IconHome size={16} />
    }
  }

  // Render dropdown content
  const renderDropdownContent = () => {
    const isLoading = homesAreLoading || inboxesAreLoading
    const hasError = homesError || inboxesError

    if (isLoading) {
      return (
        <Menu.Item disabled>
          <Group gap="xs">
            <Loader size="xs" />
            {t("common.loading", {defaultValue: "Loading..."})}
          </Group>
        </Menu.Item>
      )
    }

    if (hasError) {
      return (
        <Menu.Item disabled c="red">
          {t("common.errorLoading", {defaultValue: "Error loading folders"})}
        </Menu.Item>
      )
    }

    return (
      <>
        {/* Personal section */}
        <Menu.Label>
          <Group gap="xs">
            <IconUser size={14} />
            {t("common.personal", {defaultValue: "Personal"})}
          </Group>
        </Menu.Label>
        {user && (
          <>
            <Menu.Item
              onClick={() => onLocalClick(user.home_folder_id)}
              leftSection={<IconHome size={16} />}
            >
              {t("common.home", {defaultValue: "Home"})}
            </Menu.Item>
            <Menu.Item
              onClick={() => onLocalClick(user.inbox_folder_id)}
              leftSection={<IconInbox size={16} />}
            >
              {t("common.Inbox", {defaultValue: "Inbox"})}
            </Menu.Item>
          </>
        )}

        {/* Group sections */}
        {renderGroupSections()}
      </>
    )
  }

  // Render group home/inbox sections
  const renderGroupSections = () => {
    if (!homes || !inboxes) return null

    // Get unique group names from homes and inboxes
    const groupMap = new Map<string, {home?: GroupHome; inbox?: GroupInbox}>()

    homes.forEach(home => {
      const existing = groupMap.get(home.group_id) || {}
      groupMap.set(home.group_id, {...existing, home})
    })

    inboxes.forEach(inbox => {
      const existing = groupMap.get(inbox.group_id) || {}
      groupMap.set(inbox.group_id, {...existing, inbox})
    })

    if (groupMap.size === 0) return null

    return Array.from(groupMap.entries()).map(([groupId, {home, inbox}]) => {
      const groupName = home?.group_name || inbox?.group_name || ""

      return (
        <div key={groupId}>
          <Menu.Divider />
          <Menu.Label>
            <Group gap="xs">
              <IconUsers size={14} />
              {groupName}
            </Group>
          </Menu.Label>
          {home && (
            <Menu.Item
              onClick={() => onLocalClick(home.home_id)}
              leftSection={<IconHome size={16} />}
            >
              {t("common.home", {defaultValue: "Home"})}
            </Menu.Item>
          )}
          {inbox && (
            <Menu.Item
              onClick={() => onLocalClick(inbox.inbox_id)}
              leftSection={<IconInbox size={16} />}
            >
              {t("common.Inbox", {defaultValue: "Inbox"})}
            </Menu.Item>
          )}
        </div>
      )
    })
  }

  if (!user) {
    return <Skeleton>{t("common.home", {defaultValue: "Home"})}</Skeleton>
  }

  const handleBadgeClick = () => {
    if (context?.folderId) {
      onLocalClick(context.folderId)
    } else {
      // Fallback to user's home folder
      onLocalClick(user.home_folder_id)
    }
  }

  return (
    <Group gap={4}>
      <Badge
        variant="light"
        size="lg"
        leftSection={getRootIcon()}
        style={{cursor: "pointer"}}
        onClick={handleBadgeClick}
      >
        <Group gap={4}>
          <span style={{opacity: 0.7}}>{ownerLabel}</span>
          <span>·</span>
          <span>{folderLabel}</span>
        </Group>
      </Badge>
      <Menu shadow="md" onOpen={handleDropdownOpen}>
        <Menu.Target>
          <Badge
            variant="light"
            size="lg"
            style={{cursor: "pointer", paddingLeft: 8, paddingRight: 8}}
          >
            <IconChevronDown size={14} />
          </Badge>
        </Menu.Target>
        <Menu.Dropdown>{renderDropdownContent()}</Menu.Dropdown>
      </Menu>
    </Group>
  )
}
