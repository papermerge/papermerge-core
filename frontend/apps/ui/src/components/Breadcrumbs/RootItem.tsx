import {Badge, Group, Loader, Menu, Skeleton} from "@mantine/core"
import {
  IconChevronDown,
  IconHome,
  IconInbox,
  IconShare,
  IconUser,
  IconUsers
} from "@tabler/icons-react"

import type {GroupHome, GroupInbox, NType, UserDetails} from "@/types"

import {
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery
} from "@/features/users/storage/api"

import {useTranslation} from "react-i18next"
import useRootItem from "./useRootItem"

type HomesError = ReturnType<typeof useGetUserGroupHomesQuery>["error"]
type InboxesError = ReturnType<typeof useGetUserGroupInboxesQuery>["error"]

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

  const handleBadgeClick = () => {
    if (context?.folderId) {
      onLocalClick(context.folderId)
    } else {
      // Fallback to user's home folder
      if (user) {
        onLocalClick(user.home_folder_id)
      } else {
        console.log("Breadcrums:RootItem:handleBadgeClick: user is undefined")
      }
    }
  }

  if (!user) {
    return <Skeleton>{t("common.home", {defaultValue: "Home"})}</Skeleton>
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
        <Menu.Dropdown>
          <DropDownContent
            user={user}
            homes={homes}
            inboxes={inboxes}
            homesAreLoading={homesAreLoading}
            inboxesAreLoading={inboxesAreLoading}
            homesError={homesError}
            inboxesError={inboxesError}
            onClick={onLocalClick}
          />
        </Menu.Dropdown>
      </Menu>
    </Group>
  )
}

interface GroupSectionArgs {
  homes?: GroupHome[]
  inboxes?: GroupInbox[]
  onClick: (folderId: string) => void
}

function GroupSections({homes, inboxes, onClick}: GroupSectionArgs) {
  const {t} = useTranslation()

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
            onClick={() => onClick(home.home_id)}
            leftSection={<IconHome size={16} />}
          >
            {t("common.home", {defaultValue: "Home"})}
          </Menu.Item>
        )}
        {inbox && (
          <Menu.Item
            onClick={() => onClick(inbox.inbox_id)}
            leftSection={<IconInbox size={16} />}
          >
            {t("common.Inbox", {defaultValue: "Inbox"})}
          </Menu.Item>
        )}
      </div>
    )
  })
}

interface DropDownContentArgs {
  user?: UserDetails
  homes?: GroupHome[]
  inboxes?: GroupInbox[]
  homesAreLoading: boolean
  inboxesAreLoading: boolean
  homesError?: HomesError
  inboxesError?: InboxesError
  onClick: (folderId: string) => void
}

function DropDownContent({
  user,
  onClick,
  homes,
  inboxes,
  homesAreLoading,
  inboxesAreLoading,
  homesError,
  inboxesError
}: DropDownContentArgs) {
  const {t} = useTranslation()
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
            onClick={() => onClick(user.home_folder_id)}
            leftSection={<IconHome size={16} />}
          >
            {t("common.home", {defaultValue: "Home"})}
          </Menu.Item>
          <Menu.Item
            onClick={() => onClick(user.inbox_folder_id)}
            leftSection={<IconInbox size={16} />}
          >
            {t("common.inbox", {defaultValue: "Inbox"})}
          </Menu.Item>
          <Menu.Item
            onClick={() => onClick("shared")}
            leftSection={<IconShare size={16} />}
          >
            {t("common.shared", {defaultValue: "Shared"})}
          </Menu.Item>
        </>
      )}

      <GroupSections homes={homes} inboxes={inboxes} onClick={onClick} />
    </>
  )
}
