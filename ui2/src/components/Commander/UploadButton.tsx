import {useSelector} from "react-redux"
import {FileButton, ActionIcon, Tooltip} from "@mantine/core"
import {IconUpload} from "@tabler/icons-react"
import drop_files from "@/components/modals/DropFiles"
import {useContext} from "react"
import PanelContext from "@/contexts/PanelContext"
import {FolderType, PanelMode} from "@/types"
import {RootState} from "@/app/types"
import {selectCurrentFolder} from "@/slices/dualPanel/dualPanel"

const MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/tif",
  "application/pdf"
].join(",")

export default function UploadButton() {
  const mode: PanelMode = useContext(PanelContext)
  const target = useSelector(
    (state: RootState) =>
      selectCurrentFolder(state, mode) as FolderType | undefined
  )

  const onUpload = (files: File[]) => {
    if (!files) {
      console.error("Empty array for uploaded files")
      return
    }
    if (!target) {
      console.error("Current folder is undefined")
      return
    }

    drop_files({source_files: files, target}).then(() => {})
  }

  return (
    <FileButton onChange={onUpload} accept={MIME_TYPES} multiple>
      {props => (
        <Tooltip label="Upload" withArrow>
          <ActionIcon {...props} size="lg" variant="default">
            <IconUpload stroke={1.4} />
          </ActionIcon>
        </Tooltip>
      )}
    </FileButton>
  )
}
