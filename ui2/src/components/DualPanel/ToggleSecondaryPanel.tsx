import {Button} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  openSecondaryPanel,
  closeSecondaryPanel,
  selectPanels
} from "@/slices/dualPanel"

import type {PanelMode} from "@/types"

type Args = {
  mode: PanelMode
}

export default function ToggleSecondaryPanel({mode}: Args) {
  const [mainPanel, secondaryPanel] = useSelector(selectPanels)
  const dispatch = useDispatch()

  if (mode == "main") {
    if (!secondaryPanel) {
      return (
        <Button
          onClick={() => dispatch(openSecondaryPanel())}
          variant="default"
        >
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
