import {Badge, Group, Loader, Menu, Skeleton} from "@mantine/core"
import {
  IconChevronDown,
  IconHome,
  IconInbox,
  IconShare,
  IconUser,
  IconUsers
} from "@tabler/icons-react"

import type {GroupHome, GroupInbox, NType} from "@/types"

import {useTranslation} from "react-i18next"
import useRootItem from "./useRootItem"

type RootItemArgs = {
  itemId: string
  onClick: (n: NType) => void
}

export default function RootItem({itemId, onClick}: RootItemArgs) {
  const {t} = useTranslation()
  const {
    user,
    context,
    ownerLabel,
    folderLabel,
    rootIcon,
    homes,
    homesAreLoading,
    homesError,
    inboxes,
    inboxesAreLoading,
    inboxesError,
    actions
  } = useRootItem(itemId)

  const handleDropdownOpen = () => {
    actions.updateDropdown(true)
  }

  const onLocalClick = (folderId: string) => {
    onClick({id: folderId, ctype: "folder"})
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
              {t("common.inbox", {defaultValue: "Inbox"})}
            </Menu.Item>
            <Menu.Item
              onClick={() => onLocalClick("shared")}
              leftSection={<IconShare size={16} />}
            >
              {t("common.shared", {defaultValue: "Shared"})}
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
        leftSection={rootIcon}
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
