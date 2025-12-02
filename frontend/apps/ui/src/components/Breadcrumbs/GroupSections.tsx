import {Group, Menu} from "@mantine/core"
import {IconHome, IconInbox, IconUsers} from "@tabler/icons-react"

import type {GroupHome, GroupInbox, NType} from "@/types"

import {
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery
} from "@/features/users/storage/api"

import {useTranslation} from "react-i18next"

type HomesError = ReturnType<typeof useGetUserGroupHomesQuery>["error"]
type InboxesError = ReturnType<typeof useGetUserGroupInboxesQuery>["error"]

type RootItemArgs = {
  itemId: string
  onClick: (n: NType) => void
}

interface GroupSectionArgs {
  homes?: GroupHome[]
  inboxes?: GroupInbox[]
  onClick: (folderId: string) => void
}

export default function GroupSections({
  homes,
  inboxes,
  onClick
}: GroupSectionArgs) {
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
