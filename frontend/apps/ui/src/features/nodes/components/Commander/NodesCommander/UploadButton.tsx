import {useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {PanelMode} from "@/types"
import {ActionIcon, FileButton, Loader, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUpload} from "@tabler/icons-react"
import {useContext, useState} from "react"
import {useGetFolderQuery} from "../../../apiSlice"

import {
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES
} from "@/features/nodes/constants"
import {isSupportedFile} from "@/features/nodes/utils"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {useTranslation} from "react-i18next"
import {DropFilesModal} from "./DropFiles"
import SupportedFilesInfoModal from "./SupportedFilesInfoModal"

const MIME_TYPES = [...SUPPORTED_EXTENSIONS, ...SUPPORTED_MIME_TYPES].join(",")

export default function UploadButton() {
  const {t} = useTranslation()
  const [opened, {open, close}] = useDisclosure(false)
  const [
    supportedFilesInfoOpened,
    {open: supportedFilesInfoOpen, close: supportedFilesInfoClose}
  ] = useDisclosure(false)
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
    const validFiles = files.filter(isSupportedFile)

    if (validFiles.length === 0) {
      supportedFilesInfoOpen()
      return
    }
    setUploadFiles(files)
    open()
  }

  return (
    <>
      <FileButton onChange={onUpload} accept={MIME_TYPES} multiple>
        {props => (
          <Tooltip label={t("common.upload")} withArrow>
            <ActionIcon {...props} size="lg" variant="default">
              <IconUpload stroke={1.4} />
            </ActionIcon>
          </Tooltip>
        )}
      </FileButton>
      {uploadFiles && uploadFiles.length > 0 && (
        <DropFilesModal
          opened={opened}
          source_files={uploadFiles}
          target={target!}
          onSubmit={close}
          onCancel={close}
        />
      )}
      {supportedFilesInfoOpened && (
        <SupportedFilesInfoModal
          opened={supportedFilesInfoOpened}
          onClose={supportedFilesInfoClose}
        />
      )}
    </>
  )
}
