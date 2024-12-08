import {useAppSelector} from "@/app/hooks"

import PanelContext from "@/contexts/PanelContext"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {ActionIcon, Box, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEye} from "@tabler/icons-react"
import {forwardRef, useContext} from "react"

import type {PanelMode} from "@/types"
import {RunOCRModal} from "./RunOCRModal"

interface Args {
  hidden?: boolean
}

const RunOCRButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden} = props
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))

  return (
    <Box>
      <Tooltip label="Run OCR" withArrow>
        <ActionIcon
          style={hidden ? {display: "None"} : {}}
          ref={ref}
          size={"lg"}
          variant="default"
          onClick={open}
        >
          <IconEye stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <RunOCRModal
        opened={opened}
        node_id={currentNodeID!}
        onSubmit={close}
        onCancel={close}
      />
    </Box>
  )
})

export default RunOCRButton
