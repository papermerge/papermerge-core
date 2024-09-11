import type {RootState} from "@/app/types"
import PanelContext from "@/contexts/PanelContext"
import {selectSelectedPages} from "@/features/documentVers/documentVersSlice"
import {PanelMode} from "@/types"
import {ActionIcon, Tooltip} from "@mantine/core"
import {IconRotate} from "@tabler/icons-react"
import {useContext} from "react"
import {useDispatch, useSelector} from "react-redux"

export default function RotateCCButton() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const selectedPages = useSelector((state: RootState) =>
    selectSelectedPages(state, mode)
  )
  const onClick = () => {
    //const pages = selectedPages.map(p => p.page)
    //dispatch(rotatePages({mode, pages, angle: -90}))
  }

  return (
    <Tooltip label="Rotate selected pages counter-clockwise" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconRotate stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
