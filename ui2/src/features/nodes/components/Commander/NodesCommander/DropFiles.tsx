import {Button, Container, Group, Loader, Modal, Text} from "@mantine/core"
import {useState} from "react"

import {useAppDispatch} from "@/app/hooks"
import {apiSlice} from "@/features/api/slice"
import {uploadFile} from "@/features/nodes/uploadFile"

import Error from "@/components/Error"
import ScheduleOCRProcessCheckbox from "@/components/ScheduleOCRProcessCheckbox/ScheduleOCRProcessCheckbox"
import {useRuntimeConfig} from "@/hooks/runtime_config"
import type {FolderType, OCRCode} from "@/types"

type Args = {
  opened: boolean
  source_files: FileList | File[]
  target: FolderType
  onSubmit: () => void
  onCancel: () => void
}

export const DropFilesModal = ({
  source_files,
  target,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  if (!source_files) {
    return
  }
  const runtimeConfig = useRuntimeConfig()
  const dispatch = useAppDispatch()
  const [error, setError] = useState("")
  const [scheduleOCR, setScheduleOCR] = useState<boolean>(false)
  const [lang, setLang] = useState<OCRCode>("deu")
  const source_titles = [...source_files].map(n => n.name).join(", ")
  const target_title = target.title

  const onLangChange = (newLang: OCRCode) => {
    setLang(newLang)
  }

  const onCheckboxChange = (newValue: boolean) => {
    setScheduleOCR(newValue)
  }

  const localSubmit = async () => {
    for (let i = 0; i < source_files.length; i++) {
      dispatch(
        uploadFile({
          file: source_files[i],
          refreshTarget: true,
          ocr: scheduleOCR,
          lang: lang,
          target
        })
      ).then(() => {
        dispatch(apiSlice.util.invalidateTags(["Node"]))
      })
    }

    onSubmit()
  }

  const localCancel = () => {
    // just close the dialog
    setError("")
    onCancel()
  }

  return (
    <Modal title="Upload Files" opened={opened} onClose={localCancel}>
      <Container>
        Are you sure you want to upload
        <Text span c="blue">
          {` ${source_titles} `}
        </Text>
        to
        <Text span c="green">
          {` ${target_title}`}
        </Text>
        ?
        {!runtimeConfig.ocr__automatic && (
          <ScheduleOCRProcessCheckbox
            initialCheckboxValue={false}
            defaultLang={runtimeConfig.ocr__default_lang_code}
            onCheckboxChange={onCheckboxChange}
            onLangChange={onLangChange}
          />
        )}
        {error && <Error message={error} />}
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localSubmit}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={false}
          >
            Upload
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
