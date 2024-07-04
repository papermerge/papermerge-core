import {ActionIcon} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {IconColumns2, IconX} from "@tabler/icons-react"
import {
  openSecondaryPanel,
  closeSecondaryPanel,
  selectPanels
} from "@/slices/dualPanel"
import {fetchPaginatedNodes, setCurrentNode} from "@/slices/dualPanel"
import {selectCurrentUser} from "@/slices/currentUser"

import type {PanelMode, User} from "@/types"

type Args = {
  mode: PanelMode
}

export default function ToggleSecondaryPanel({mode}: Args) {
  const [mainPanel, secondaryPanel] = useSelector(selectPanels)
  const user: User = useSelector(selectCurrentUser)
  const dispatch = useDispatch()

  if (mainPanel) {
    // mainPanel is always there
  }

  const onClick = () => {
    const folderId = user.home_folder_id
    dispatch(openSecondaryPanel())
    dispatch(
      fetchPaginatedNodes({
        folderId,
        panel: "secondary",
        urlParams: new URLSearchParams("")
      })
    )
    dispatch(
      setCurrentNode({
        node: {id: folderId, ctype: "folder"},
        panel: "secondary"
      })
    )
  }

  if (mode == "main") {
    if (!secondaryPanel) {
      return (
        <ActionIcon size="lg" onClick={onClick} variant="default">
          <IconColumns2 size={18} />
        </ActionIcon>
      )
    }

    return <></>
  }

  return (
    <ActionIcon
      onClick={() => dispatch(closeSecondaryPanel())}
      size="lg"
      variant="default"
    >
      <IconX size={18} />
    </ActionIcon>
  )
}
