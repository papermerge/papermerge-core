import {useContext} from "react"
import {ActionIcon} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {IconColumns2, IconX} from "@tabler/icons-react"
import {
  openSecondaryPanel,
  closeSecondaryPanel,
  selectMainPanel,
  selectSecondaryPanel
} from "@/slices/dualPanel/dualPanel"
import {selectCurrentUser} from "@/slices/currentUser"

import type {PanelMode, User} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {currentNodeChanged} from "@/features/ui/uiSlice"

export default function ToggleSecondaryPanel() {
  const mode: PanelMode = useContext(PanelContext)
  const mainPanel = useSelector(selectMainPanel)
  const secondaryPanel = useSelector(selectSecondaryPanel)
  const user: User = useSelector(selectCurrentUser)
  const dispatch = useDispatch()

  if (mainPanel) {
    // mainPanel is always there
  }

  const onClick = () => {
    const folderId = user.home_folder_id
    dispatch(
      openSecondaryPanel({
        id: folderId,
        ctype: "folder",
        breadcrumb: null
      })
    )
    dispatch(
      currentNodeChanged({id: folderId, ctype: "folder", panel: "secondary"})
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
