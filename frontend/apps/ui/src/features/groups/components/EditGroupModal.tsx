import {
  Checkbox,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import {CancelButton, SaveButton} from "@/components/buttons"
import {
  useEditGroupMutation,
  useGetGroupQuery
} from "@/features/groups/storage/api"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  groupId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditGroupModal({
  groupId,
  onSubmit,
  onCancel,
  opened
}: Args) {
  const {t} = useTranslation()
  const {data, isLoading} = useGetGroupQuery(groupId)
  const [updateGroup, {isLoading: isLoadingGroupUpdate}] =
    useEditGroupMutation()
  const [name, setName] = useState<string>("")
  const [withSpecialFolders, setWithSpecialFolders] = useState<boolean>(false)

  useEffect(() => {
    formReset()
  }, [isLoading, data, opened])

  const formReset = () => {
    if (data) {
      setName(data.name)
      if (data.home_folder_id && data.inbox_folder_id) {
        setWithSpecialFolders(true)
      } else {
        setWithSpecialFolders(false)
      }
    } else {
      setName("")
      setWithSpecialFolders(false)
    }
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      id: groupId,
      name: name!,
      with_special_folders: withSpecialFolders
    }
    await updateGroup(updatedData)
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    formReset()
    onCancel()
  }

  return (
    <Modal
      title={t("groups.edit.title")}
      opened={opened}
      size="lg"
      onClose={onLocalCancel}
    >
      <LoadingOverlay
        visible={data == null || isLoading}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <TextInput
        value={name}
        onChange={e => setName(e.currentTarget.value)}
        label={t("groups.form.name")}
        placeholder={t("groups.form.name.placeholder")}
      />
      <Checkbox
        checked={withSpecialFolders}
        onChange={e => setWithSpecialFolders(e.currentTarget.checked)}
        my="md"
        label="Group with special folders: inbox and home"
      />
      <Group justify="space-between" mt="md">
        <CancelButton onClick={onLocalCancel} t={t} />
        <Group>
          {isLoadingGroupUpdate && <Loader size="sm" />}
          <SaveButton
            disabled={isLoadingGroupUpdate}
            onClick={onLocalSubmit}
            t={t}
          />
        </Group>
      </Group>
    </Modal>
  )
}
