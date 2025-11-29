import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelAllCustom,
  setPanelCustomState
} from "@/features/ui/panelRegistry"
import {Flex, UnstyledButton} from "@mantine/core"
import {
  IconLayoutSidebarRight,
  IconLayoutSidebarRightFilled
} from "@tabler/icons-react"
import classes from "./DocumentDetailsToggle.module.css"

export default function DocumentDetailssToggle() {
  const dispatch = useAppDispatch()
  const {panelId} = usePanel()
  const {documentDetailsPanelIsOpen: isOpen} = useAppSelector(s =>
    selectPanelAllCustom(s, panelId)
  )

  const onClick = () => {
    dispatch(
      setPanelCustomState({
        panelId,
        key: "documentDetailsPanelIsOpen",
        value: !isOpen
      })
    )
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
