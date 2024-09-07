import {useContext} from "react"
import {useDisclosure} from "@mantine/hooks"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconFolderPlus} from "@tabler/icons-react"
import {useSelector} from "react-redux"
import {selectCurrentFolderID} from "@/slices/dualPanel/dualPanel"

import type {RootState} from "@/app/types"
import type {PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {NewFolderModal} from "./NewFolder"

export default function NewFolderButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const currentFolderId = useSelector((state: RootState) =>
    selectCurrentFolderID(state, mode)
  )

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
