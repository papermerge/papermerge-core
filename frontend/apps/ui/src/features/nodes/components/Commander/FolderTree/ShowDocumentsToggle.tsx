import {ActionIcon, Tooltip} from "@mantine/core"
import {IconFiles, IconFilesOff} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

import useFolderTreeSetting from "./useFolderTreeSetting"

const FOLDER_TREE_SHOW_DOCUMENTS = "folderTreeShowDocuments"

export function useFolderTreeShowDocuments() {
  return useFolderTreeSetting(FOLDER_TREE_SHOW_DOCUMENTS, true)
}

export default function ShowDocumentsToggle() {
  const {t} = useTranslation()
  const [showDocuments, setShowDocuments] = useFolderTreeShowDocuments()
  const label = showDocuments
    ? t("nodes.folderTree.hideDocuments", {defaultValue: "Hide documents"})
    : t("nodes.folderTree.showDocuments", {defaultValue: "Show documents"})

  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        size="sm"
        variant="subtle"
        color="gray"
        aria-label={label}
        onClick={() => setShowDocuments(!showDocuments)}
      >
        {showDocuments ? (
          <IconFilesOff size={16} stroke={1.5} />
        ) : (
          <IconFiles size={16} stroke={1.5} />
        )}
      </ActionIcon>
    </Tooltip>
  )
}
