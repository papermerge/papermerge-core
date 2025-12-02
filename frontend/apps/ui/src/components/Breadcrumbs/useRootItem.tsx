import {useAppSelector} from "@/app/hooks"
import {IconHome, IconInbox, IconShare} from "@tabler/icons-react"
import {useState} from "react"

import type {BreadcrumbRootType, UserDetails} from "@/types"

import {
  useGetUserGroupHomesQuery,
  useGetUserGroupInboxesQuery
} from "@/features/users/storage/api"
import {selectCurrentUser} from "@/slices/currentUser"
import {equalUUIDs} from "@/utils"
import {useTranslation} from "react-i18next"

type RootContext = {
  type: "personal" | "group"
  groupName?: string
  rootType: BreadcrumbRootType
  folderId: string
}

export default function useRootItem(itemId: string) {
  const {t} = useTranslation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const user = useAppSelector(selectCurrentUser) as UserDetails | undefined
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

  const actions = {
    updateDropdown: (newValue: boolean) => {
      setIsDropdownOpen(newValue)
    }
  }

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

  const rootIcon = getRootIcon()

  return {
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
  }
}
