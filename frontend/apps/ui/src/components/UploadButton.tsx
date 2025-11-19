import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {apiSlice} from "@/features/api/slice"
import {uploadFile} from "@/features/files/filesSlice"
import {generateThumbnail} from "@/features/nodes/thumbnailObjectsSlice"
import type {UploadFileOutput} from "@/features/nodes/types"
import {Button, FileButton, Menu} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUpload} from "@tabler/icons-react"
import {useState} from "react"

import {
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES
} from "@/features/nodes/constants"
import {isSupportedFile} from "@/features/nodes/utils"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {selectCurrentUser} from "@/slices/currentUser"
import {
  IconChevronDown,
  IconFolder,
  IconHome,
  IconInbox
} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import SupportedFilesInfoModal from "../features/nodes/components/Commander/NodesCommander/SupportedFilesInfoModal"

const MIME_TYPES = [...SUPPORTED_EXTENSIONS, ...SUPPORTED_MIME_TYPES].join(",")
type UploadDestination = {
  id: string
  label: string
  icon: React.ReactNode
}

export default function UploadButton() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const [
    supportedFilesInfoOpened,
    {open: supportedFilesInfoOpen, close: supportedFilesInfoClose}
  ] = useDisclosure(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>()
  const folderID = useAppSelector(s => selectCurrentNodeID(s, "main"))
  const currentUser = useAppSelector(selectCurrentUser)
  const userPreferences = useAppSelector(selectMyPreferences)
  let destinations: UploadDestination[] = [
    {
      id: currentUser.inbox_folder_id,
      label: t("common.inbox", {defaultValue: "Inbox"}),
      icon: <IconInbox size={16} />
    },
    {
      id: currentUser.home_folder_id,
      label: t("common.home", {defaultValue: "Home"}),
      icon: <IconHome size={16} />
    }
  ]

  if (
    folderID &&
    folderID != currentUser.home_folder_id &&
    folderID != currentUser.inbox_folder_id
  ) {
    destinations.push({
      id: folderID,
      label: t("common.current_location", {defaultValue: "Current Location"}),
      icon: <IconFolder size={16} />
    })
  }

  const onUpload = async (files: File[], destinationID: string) => {
    if (!files) {
      console.error("Empty array for uploaded files")
      return
    }

    const validFiles = files.filter(isSupportedFile)

    if (validFiles.length === 0) {
      supportedFilesInfoOpen()
      return
    }
    if (uploadFiles) {
      for (let i = 0; i < uploadFiles.length; i++) {
        const result = await dispatch(
          uploadFile({
            file: uploadFiles[i],
            refreshTarget: true,
            lang: userPreferences.uploaded_document_lang,
            ocr: false,
            target_id: destinationID
          })
        )
        const newlyCreatedNode = result.payload as UploadFileOutput

        if (newlyCreatedNode.source?.id) {
          const newNodeID = newlyCreatedNode.source?.id
          dispatch(
            generateThumbnail({node_id: newNodeID, file: uploadFiles[i]})
          )
        }
        dispatch(apiSlice.util.invalidateTags(["Node"]))
      }
    }
  }

  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button rightSection={<IconChevronDown size={16} />}>
            <IconUpload size={16} style={{marginRight: 8}} />
            {t("common.upload")}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>
            {t("common.upload_to", {defaultValue: "Upload to"})}
          </Menu.Label>
          {destinations.map(dest => (
            <FileButton
              key={dest.id}
              onChange={files => onUpload(files, dest.id)}
              accept={MIME_TYPES}
              multiple
            >
              {props => (
                <Menu.Item leftSection={dest.icon} {...props}>
                  {dest.label}
                </Menu.Item>
              )}
            </FileButton>
          ))}
        </Menu.Dropdown>
      </Menu>

      {supportedFilesInfoOpened && (
        <SupportedFilesInfoModal
          opened={supportedFilesInfoOpened}
          onClose={supportedFilesInfoClose}
        />
      )}
    </>
  )
}
