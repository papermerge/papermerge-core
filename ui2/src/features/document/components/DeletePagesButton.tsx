import {useContext} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {PanelMode} from "@/types"
import {ActionIcon, Tooltip} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"

import {
  pagesDeleted,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {
  selectCurrentDocVerID,
  viewerSelectionCleared
} from "@/features/ui/uiSlice"

import PanelContext from "@/contexts/PanelContext"

export default function DeleteButton() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []

  const onClick = () => {
    dispatch(
      pagesDeleted({
        sources: selectedPages,
        targetDocVerID: docVerID!
      })
    )
    dispatch(viewerSelectionCleared(mode))
  }

  return (
    <>
      <Tooltip withArrow label="Delete">
        <ActionIcon size="lg" onClick={onClick} color={"red"}>
          <IconTrash />
        </ActionIcon>
      </Tooltip>
    </>
  )
}
