import {useAppSelector} from "@/app/hooks"
import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconFolderPlus} from "@tabler/icons-react"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {useTranslation} from "react-i18next"
import {NewFolderModal} from "../../NewFolder"

export default function NewFolderButton() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const {panelId} = usePanel()
  const currentFolderId = useAppSelector(s => selectCurrentNodeID(s, panelId))

  return (
    <>
      <Tooltip label={t("folder.new.title")} withArrow>
        <ActionIcon size={"lg"} variant="default" onClick={open}>
          <IconFolderPlus stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <NewFolderModal
        opened={opened}
        parent_id={currentFolderId!}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
