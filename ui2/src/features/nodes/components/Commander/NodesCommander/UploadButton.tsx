import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"
import {ActionIcon, FileButton, Loader, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUpload} from "@tabler/icons-react"
import {useContext, useState} from "react"
import {useGetFolderQuery} from "../../../apiSlice"

import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {DropFilesModal} from "./DropFiles"

const MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/tif",
  "application/pdf"
].join(",")

export default function UploadButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>()
  const mode: PanelMode = useContext(PanelContext)
  const folderID = useAppSelector(s => selectCurrentNodeID(s, mode))

  if (!folderID) {
    return <Loader size={"xs"} />
  }

  const {data: target} = useGetFolderQuery(folderID)

  const onUpload = (files: File[]) => {
    if (!files) {
      console.error("Empty array for uploaded files")
      return
    }
    if (!target) {
      console.error("Current folder is undefined")
      return
    }
    setUploadFiles(files)
    open()
  }

  return (
    <>
      <FileButton onChange={onUpload} accept={MIME_TYPES} multiple>
        {props => (
          <Tooltip label="Upload" withArrow>
            <ActionIcon {...props} size="lg" variant="default">
              <IconUpload stroke={1.4} />
            </ActionIcon>
          </Tooltip>
        )}
      </FileButton>
      <DropFilesModal
        opened={opened}
        source_files={uploadFiles!}
        target={target!}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
