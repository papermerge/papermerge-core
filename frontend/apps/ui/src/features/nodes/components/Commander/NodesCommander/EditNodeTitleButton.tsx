import {useAppDispatch} from "@/app/hooks"
import EditNodeTitleModal from "@/components/EditNodeTitleModal"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {clearPanelSelection} from "@/features/ui/panelRegistry"
import type {NodeType} from "@/types"
import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

interface Args {
  selectedNodes: NodeType[]
}

export default function EditNodeTitleButton({selectedNodes}: Args) {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const {panelId} = usePanel()

  const dispatch = useAppDispatch()
  let node: NodeType = selectedNodes[0]

  const onClick = () => {
    if (selectedNodes.length < 1) {
      console.log("Error: no selected nodes")
      return
    }
    node = selectedNodes[0]
    open()
  }

  const onSubmit = () => {
    dispatch(clearPanelSelection({panelId}))
    close()
  }

  const onCancel = () => {
    dispatch(clearPanelSelection({panelId}))
    close()
  }

  return (
    <>
      <Tooltip label={t("common.change_title")} withArrow>
        <ActionIcon size={"lg"} variant="default" onClick={onClick}>
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <EditNodeTitleModal
        opened={opened}
        node={node}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  )
}
