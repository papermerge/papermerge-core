import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {apiSlice} from "@/features/api/slice"
import {uploadFile} from "@/features/files/storage/thunks"
import type {UploadFileOutput} from "@/features/files/types"
import {generateThumbnail} from "@/features/nodes/storage/thumbnailObjectsSlice"
import {Button, Menu} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUpload} from "@tabler/icons-react"

import {
  SUPPORTED_EXTENSIONS,
  SUPPORTED_MIME_TYPES
} from "@/features/nodes/constants"
import {isSupportedFile} from "@/features/nodes/utils"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import useUploadDestinationFolder from "@/hooks/useUploadDestinationFolder"
import {IconChevronDown} from "@tabler/icons-react"
import {useRef, useState} from "react"
import {useTranslation} from "react-i18next"
import SupportedFilesInfoModal from "../../nodes/components/Commander/NodesCommander/SupportedFilesInfoModal"

const MIME_TYPES = [...SUPPORTED_EXTENSIONS, ...SUPPORTED_MIME_TYPES].join(",")

export default function UploadButton() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const [selectedDestinationID, setSelectedDestinationID] = useState<string>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [
    supportedFilesInfoOpened,
    {open: supportedFilesInfoOpen, close: supportedFilesInfoClose}
  ] = useDisclosure(false)

  const userPreferences = useAppSelector(selectMyPreferences)

  let destinations = useUploadDestinationFolder()

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files

    if (!files || files.length === 0 || !selectedDestinationID) {
      console.error("No files selected or no destination")
      return
    }

    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(isSupportedFile)

    if (validFiles.length === 0) {
      supportedFilesInfoOpen()
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }

    for (let i = 0; i < validFiles.length; i++) {
      const result = await dispatch(
        uploadFile({
          file: validFiles[i],
          lang: userPreferences.uploaded_document_lang,
          ocr: false,
          target_id: selectedDestinationID
        })
      )
      const newlyCreatedNode = result.payload as UploadFileOutput

      if (
        newlyCreatedNode &&
        newlyCreatedNode.node &&
        newlyCreatedNode.success
      ) {
        const newNodeID = newlyCreatedNode.node?.id
        dispatch(generateThumbnail({node_id: newNodeID, file: validFiles[i]}))
      }
    }

    dispatch(apiSlice.util.invalidateTags(["Node"]))

    // Reset the file input and destination
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setSelectedDestinationID(undefined)
  }

  const handleMenuItemClick = (destinationID: string) => {
    console.log("Menu item clicked, destination:", destinationID)
    setSelectedDestinationID(destinationID)
    // Trigger file input click
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 100)
  }

  const MenuItems = destinations.map(dest => {
    const Icon = dest.icon
    return (
      <Menu.Item
        key={dest.id}
        leftSection={<Icon size={16} />}
        onClick={() => handleMenuItemClick(dest.id)}
      >
        {dest.label}
      </Menu.Item>
    )
  })

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={MIME_TYPES}
        multiple
        onChange={handleFileChange}
        style={{display: "none"}}
      />

      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button rightSection={<IconChevronDown size={16} />}>
            <IconUpload size={16} style={{marginRight: 8}} />
            {t("common.upload", {defaultValue: "Upload"})}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>
            {t("common.upload_to", {defaultValue: "Upload to"})}
          </Menu.Label>
          {MenuItems}
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
