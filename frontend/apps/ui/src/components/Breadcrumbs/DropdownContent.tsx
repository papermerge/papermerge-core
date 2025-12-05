import type {BreadcrumbRootType} from "@/types"
import {Group, Loader, Menu} from "@mantine/core"
import {IconHome, IconInbox, IconShare, IconUser} from "@tabler/icons-react"

import type {GroupHome, GroupInbox, UserDetails} from "@/types"

import {
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery
} from "@/features/users/storage/api"

import {useTranslation} from "react-i18next"
import GroupSections from "./GroupSections"

type HomesError = ReturnType<typeof useGetUserGroupHomesQuery>["error"]
type InboxesError = ReturnType<typeof useGetUserGroupInboxesQuery>["error"]

interface Args {
  user?: UserDetails
  homes?: GroupHome[]
  inboxes?: GroupInbox[]
  homesAreLoading: boolean
  inboxesAreLoading: boolean
  homesError?: HomesError
  inboxesError?: InboxesError
  onClick: (folderId: string, rootType?: BreadcrumbRootType) => void
}

export default function DropdownContent({
  user,
  onClick,
  homes,
  inboxes,
  homesAreLoading,
  inboxesAreLoading,
  homesError,
  inboxesError
}: Args) {
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
            onClick={() => onClick(user.home_folder_id, "home")}
            leftSection={<IconHome size={16} />}
          >
            {t("common.home", {defaultValue: "Home"})}
          </Menu.Item>
          <Menu.Item
            onClick={() => onClick(user.inbox_folder_id, "inbox")}
            leftSection={<IconInbox size={16} />}
          >
            {t("common.inbox", {defaultValue: "Inbox"})}
          </Menu.Item>
          <Menu.Item
            onClick={() => onClick("shared", "shared")}
            leftSection={<IconShare size={16} />}
          >
            {t("common.shared", {defaultValue: "Shared"})}
          </Menu.Item>
        </>
      )}

      <GroupSections
        homes={homes}
        inboxes={inboxes}
        onClick={(folderId: string) => onClick(folderId, undefined)}
      />
    </>
  )
}
