import {useContext} from "react"
import {useDisclosure} from "@mantine/hooks"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconFolderPlus} from "@tabler/icons-react"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {useAppSelector} from "@/app/hooks"

import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {NewFolderModal} from "./NewFolder"

export default function NewFolderButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const currentFolderId = useAppSelector(s => selectCurrentNodeID(s, mode))

  return (
    <>
      <Tooltip label="New Folder" withArrow>
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
