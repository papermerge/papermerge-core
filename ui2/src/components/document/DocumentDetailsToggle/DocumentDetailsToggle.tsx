import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  selectDocumentDetailsPanelOpen,
  viewerDocumentDetailsPanelToggled
} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {Flex, UnstyledButton} from "@mantine/core"
import {
  IconLayoutSidebarRight,
  IconLayoutSidebarRightFilled
} from "@tabler/icons-react"
import {useContext} from "react"
import classes from "./DocumentDetailsToggle.module.css"

export default function DocumentDetailssToggle() {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const isOpen = useAppSelector(s => selectDocumentDetailsPanelOpen(s, mode))

  const onClick = () => {
    dispatch(viewerDocumentDetailsPanelToggled(mode))
  }

  const toggleElement = (
    <UnstyledButton onClick={() => onClick()}>
      {isOpen ? <IconLayoutSidebarRightFilled /> : <IconLayoutSidebarRight />}
    </UnstyledButton>
  )

  if (isOpen) {
    return (
      <Flex
        align={"flex-start"}
        className={classes.documentDetailsToggleOpened}
      >
        {toggleElement}
      </Flex>
    )
  }

  return (
    <Flex align={"flex-start"} className={classes.documentDetailsToggleClosed}>
      {toggleElement}
    </Flex>
  )
}
