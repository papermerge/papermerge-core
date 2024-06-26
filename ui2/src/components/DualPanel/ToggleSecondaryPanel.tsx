import {Button} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
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

  const onClick = () => {
    const folderId = user.home_folder_id
    dispatch(openSecondaryPanel({folderId}))
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
        <Button onClick={onClick} variant="default">
          Open
        </Button>
      )
    }

    return <></>
  }

  return (
    <Button onClick={() => dispatch(closeSecondaryPanel())} variant="default">
      Close
    </Button>
  )
}
