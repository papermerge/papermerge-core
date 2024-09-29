import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  selectDocumentDetailsPanelOpen,
  viewerDocumentDetailsPanelToggled
} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {Flex, UnstyledButton} from "@mantine/core"
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand
} from "@tabler/icons-react"
import {useContext} from "react"

export default function DocumentDetailssToggle() {
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const isOpen = useAppSelector(s => selectDocumentDetailsPanelOpen(s, mode))

  const onClick = () => {
    dispatch(viewerDocumentDetailsPanelToggled(mode))
  }

  const toggleElement = (
    <UnstyledButton onClick={() => onClick()}>
      {isOpen ? (
        <IconLayoutSidebarLeftExpand />
      ) : (
        <IconLayoutSidebarLeftCollapse />
      )}
    </UnstyledButton>
  )

  return <Flex align={"flex-start"}>{toggleElement}</Flex>
}
