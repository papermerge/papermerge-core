import {useAppSelector} from "@/app/hooks"

import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {ActionIcon, Box, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEye} from "@tabler/icons-react"
import {forwardRef} from "react"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {useTranslation} from "react-i18next"
import {RunOCRModal} from "./RunOCRModal"

interface Args {
  hidden?: boolean
}

const RunOCRButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {t} = useTranslation()
  const {hidden} = props
  const [opened, {open, close}] = useDisclosure(false)
  const {panelId} = usePanel()
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))

  return (
    <Box>
      <Tooltip label={t("common.run_ocr")} withArrow>
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
