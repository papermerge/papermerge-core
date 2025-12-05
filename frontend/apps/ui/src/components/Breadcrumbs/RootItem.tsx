import {Badge, Group, Menu, Skeleton} from "@mantine/core"
import {IconChevronDown} from "@tabler/icons-react"

import type {BreadcrumbRootType, NType} from "@/types"

import {useAppDispatch} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {updateCurrentNavBarMenuItem} from "@/features/ui/uiSlice"
import {useTranslation} from "react-i18next"
import DropdownContent from "./DropdownContent"
import useRootItem from "./useRootItem"

type Args = {
  itemId: string
  onClick: (n: NType) => void
}

export default function RootItem({itemId, onClick}: Args) {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()

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

  const onLocalClick = (folderId: string, rootType?: BreadcrumbRootType) => {
    if (rootType === "home" && panelId == "main") {
      dispatch(updateCurrentNavBarMenuItem("/home"))
    }
    if (rootType === "inbox" && panelId == "main") {
      dispatch(updateCurrentNavBarMenuItem("/inbox"))
    }
    if (rootType === "shared" && panelId == "main") {
      dispatch(updateCurrentNavBarMenuItem("/shared"))
    }
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
          <DropdownContent
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
