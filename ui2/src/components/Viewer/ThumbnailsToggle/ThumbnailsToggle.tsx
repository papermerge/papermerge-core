import {useContext} from "react"
import {useDispatch} from "react-redux"
import {UnstyledButton, Flex} from "@mantine/core"
import {IconMenu2} from "@tabler/icons-react"
import classes from "./ThumbnailsToggle.module.css"
import {toggleThumbnailsPanel} from "@/slices/dualPanel/dualPanel"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"

export default function ThumbnailsToggle() {
  const dispatch = useDispatch()
  const mode: PanelMode = useContext(PanelContext)

  const onClick = () => {
    dispatch(toggleThumbnailsPanel(mode))
  }

  return (
    <Flex align={"flex-start"} className={classes.thumbnailsToggle}>
      <UnstyledButton onClick={() => onClick()}>
        <IconMenu2 />
      </UnstyledButton>
    </Flex>
  )
}
