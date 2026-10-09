import {ActionIcon, Tooltip} from "@mantine/core"
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand
} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import useFolderTreeSetting from "./useFolderTreeSetting"

const FOLDER_TREE_OPENED = "folderTreeOpened"

export function useFolderTreeOpened() {
  return useFolderTreeSetting(FOLDER_TREE_OPENED, false)
}

export default function FolderTreeToggle() {
  const {t} = useTranslation()
  const [opened, setOpened] = useFolderTreeOpened()
  const label = opened
    ? t("nodes.folderTree.hide", {defaultValue: "Hide folder tree"})
    : t("nodes.folderTree.show", {defaultValue: "Show folder tree"})

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        size="lg"
        variant={opened ? "light" : "default"}
        aria-label={label}
        aria-pressed={opened}
        onClick={() => setOpened(!opened)}
      >
        {opened ? (
          <IconLayoutSidebarLeftCollapse stroke={1.4} />
        ) : (
          <IconLayoutSidebarLeftExpand stroke={1.4} />
        )}
      </ActionIcon>
    </Tooltip>
  )
}
