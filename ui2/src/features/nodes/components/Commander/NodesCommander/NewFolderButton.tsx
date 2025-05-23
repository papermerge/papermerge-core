import {useAppSelector} from "@/app/hooks"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconFolderPlus} from "@tabler/icons-react"
import {useContext} from "react"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {NewFolderModal} from "../../NewFolder"
import {useTranslation} from "react-i18next"

export default function NewFolderButton() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const currentFolderId = useAppSelector(s => selectCurrentNodeID(s, mode))

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
