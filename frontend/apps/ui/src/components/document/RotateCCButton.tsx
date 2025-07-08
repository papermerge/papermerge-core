import {useAppDispatch} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {useCurrentDocVer, useSelectedPages} from "@/features/document/hooks"
import {pagesRotated} from "@/features/document/store/documentVersSlice"
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
  const {docVer} = useCurrentDocVer()
  const selectedPages = useSelectedPages({mode, docVerID: docVer?.id})

  const onClick = () => {
    dispatch(
      pagesRotated({
        sources: selectedPages,
        angle: -90,
        targetDocVerID: docVer?.id!
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
