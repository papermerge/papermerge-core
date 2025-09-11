import ToggleSecondaryPanel from "@/components/DualPanel/ToggleSecondaryPanel"
import PanelContext from "@/contexts/PanelContext"
import DeletePagesButton from "@/features/document/components/DeletePagesButton"
import EditTitleButton from "@/features/document/components/EditTitleButton"
import {useRuntimeConfig} from "@/hooks/runtime_config"
import {Group} from "@mantine/core"
import {useContext} from "react"

import DuplicatePanelButton from "@/components/DualPanel/DuplicatePanelButton"
import DownloadButton from "@/features/document/components/DownloadButton"
import RotateButton from "@/features/document/components/RotateButton"
import RotateCCButton from "@/features/document/components/RotateCCButton"
import RunOCRButton from "@/features/document/components/RunOCRButton"
import {useCurrentDocVer, useSelectedPages} from "@/features/document/hooks"

interface Args {
  onEditNodeTitleClicked: () => void
  onRotateCWClicked: () => void
  onRotateCCClicked: () => void
  onDeletePagesClicked: () => void
}

export default function ActionButtons({
  onEditNodeTitleClicked,
  onRotateCWClicked,
  onRotateCCClicked,
  onDeletePagesClicked
}: Args) {
  const mode = useContext(PanelContext)
  const {docVer} = useCurrentDocVer()
  const selectedPages = useSelectedPages({mode, docVerID: docVer?.id})
  const runtimeConfig = useRuntimeConfig()

  return (
    <Group justify="space-between">
      <Group>
        <EditTitleButton onClick={onEditNodeTitleClicked} />
        {!runtimeConfig.ocr__automatic && <RunOCRButton />}
        <DownloadButton />
        {selectedPages.length > 0 && (
          <RotateButton onClick={onRotateCWClicked} />
        )}
        {selectedPages.length > 0 && (
          <RotateCCButton onClick={onRotateCCClicked} />
        )}
        {selectedPages.length > 0 && (
          <DeletePagesButton onClick={onDeletePagesClicked} />
        )}
      </Group>
      <Group>
        <DuplicatePanelButton />
        <ToggleSecondaryPanel />
      </Group>
    </Group>
  )
}
