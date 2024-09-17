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
import {forwardRef, useContext} from "react"

interface Args {
  hidden?: boolean
}

const RotateCCButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden} = props
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const selectedPages = useAppSelector(s => selectSelectedPages(s, mode)) || []
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
      <ActionIcon
        ref={ref}
        size={"lg"}
        variant="default"
        onClick={onClick}
        style={hidden ? {display: "None"} : {}}
      >
        <IconRotate stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
})

export default RotateCCButton
