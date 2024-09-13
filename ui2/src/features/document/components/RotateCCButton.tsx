import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  pagesRotated,
  selectSelectedPages
} from "@/features/document/documentVersSlice"
import {selectCurrentDocVerID} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {ActionIcon, Tooltip} from "@mantine/core"
import {IconRotate} from "@tabler/icons-react"
import {useContext} from "react"

export default function RotateCCButton() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode))
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))

  const onClick = () => {
    dispatch(
      pagesRotated({
        sources: selectedPages,
        angle: -90,
        targetDocVerID: docVerID!
      })
    )
  }

  return (
    <Tooltip label="Rotate selected pages counter-clockwise" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconRotate stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
