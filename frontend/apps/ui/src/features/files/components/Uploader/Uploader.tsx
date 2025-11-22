// ui/features/files/components/Uploader.tsx
import {useAppDispatch, useAppSelector} from "@/app/hooks"
import type {UploadingFile} from "@/features/files/storage/files"
import {
  selectUploaderOpened,
  selectUploadsList,
  uploaderClosed,
  uploadRemoved
} from "@/features/files/storage/files"
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Progress,
  Stack,
  Text
} from "@mantine/core"
import {IconAlertCircle, IconCheck, IconX} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"

export default function Uploader() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const opened = useAppSelector(selectUploaderOpened)
  const uploads = useAppSelector(selectUploadsList)

  if (!opened || uploads.length === 0) {
    return null
  }

  const handleClose = () => {
    dispatch(uploaderClosed())
  }

  const handleRemove = (upload: UploadingFile) => {
    dispatch(
      uploadRemoved({
        targetId: upload.targetId,
        fileName: upload.fileName
      })
    )
  }

  return (
    <Paper
      shadow="lg"
      p="md"
      radius="md"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 400,
        maxHeight: 500,
        overflow: "auto",
        zIndex: 1000
      }}
    >
      <Group justify="space-between" mb="md">
        <Text fw={600}>
          {t("uploader.uploads", {
            count: uploads.length,
            defaultValue: "Uploads ({{count}})"
          })}
        </Text>
        <ActionIcon variant="subtle" onClick={handleClose}>
          <IconX size={16} />
        </ActionIcon>
      </Group>

      <Stack gap="sm">
        {uploads.map(upload => (
          <UploadItem
            key={`${upload.targetId}-${upload.fileName}`}
            upload={upload}
            onRemove={() => handleRemove(upload)}
          />
        ))}
      </Stack>
    </Paper>
  )
}

interface UploadItemProps {
  upload: UploadingFile
  onRemove: () => void
}

function UploadItem({upload, onRemove}: UploadItemProps) {
  const {t} = useTranslation()

  const getStatusIcon = () => {
    switch (upload.status) {
      case "success":
        return <IconCheck size={16} color="green" />
      case "error":
        return <IconAlertCircle size={16} color="red" />
      case "uploading":
        return null
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (upload.status) {
      case "success":
        return "green"
      case "error":
        return "red"
      case "uploading":
        return "blue"
      default:
        return "gray"
    }
  }

  return (
    <Box>
      <Group justify="space-between" wrap="nowrap">
        <Box style={{flex: 1, minWidth: 0}}>
          <Group gap="xs" wrap="nowrap">
            {getStatusIcon()}
            <Text size="sm" truncate style={{flex: 1}}>
              {upload.fileName}
            </Text>
          </Group>

          {upload.status === "uploading" && (
            <Progress
              value={upload.progress || 0}
              size="xs"
              mt="xs"
              color={getStatusColor()}
            />
          )}

          {upload.error && (
            <Text size="xs" c="red" mt="xs">
              {upload.error}
            </Text>
          )}

          {upload.status === "success" && (
            <Text size="xs" c="dimmed" mt="xs">
              {t("uploader.uploadedSuccessfully", {
                defaultValue: "Uploaded successfully"
              })}
            </Text>
          )}
        </Box>

        {(upload.status === "success" || upload.status === "error") && (
          <ActionIcon variant="subtle" size="sm" onClick={onRemove}>
            <IconX size={14} />
          </ActionIcon>
        )}
      </Group>
    </Box>
  )
}
