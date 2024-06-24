import {Group, Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"
import {useSelector, useDispatch} from "react-redux"
import {folderAdded} from "@/slices/paginatedNodes"
import {selectCurrentNodeId} from "@/slices/currentNode"
import type {NodeType} from "@/types"
import create_new_folder from "@/components/modals/NewFolder"

export default function FolderNodeActions() {
  const dispatch = useDispatch()
  const currentFolderId = useSelector(selectCurrentNodeId)

  const onNewFolder = () => {
    create_new_folder(currentFolderId).then((new_folder: NodeType) => {
      dispatch(folderAdded(new_folder))
    })
  }

  return (
    <Group justify="center">
      <Button
        leftSection={<IconPlus size={14} />}
        onClick={onNewFolder}
        variant="default"
      >
        New Folder
      </Button>
    </Group>
  )
}
