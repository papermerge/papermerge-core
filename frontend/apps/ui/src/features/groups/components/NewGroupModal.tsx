import {
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  Text,
  TextInput
} from "@mantine/core"
import {useEffect, useState} from "react"

import {useAddNewGroupMutation} from "@/features/groups/apiSlice"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewGroupModal({onCancel, onSubmit, opened}: Args) {
  const {t} = useTranslation()
  const [addNewGroup, {isLoading, isError, isSuccess}] =
    useAddNewGroupMutation()
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [withSpecialFolders, setWithSpecialFolders] = useState<boolean>(false)

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
    }
  }, [isSuccess])

  const reset = () => {
    setName("")
    setError("")
    setWithSpecialFolders(false)
  }

  const onCheckboxClicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.checked
    setWithSpecialFolders(value)
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      name: name!,
      with_special_folders: withSpecialFolders
    }
    try {
      await addNewGroup(updatedData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
    reset()
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const onNameChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value)
  }

  return (
    <Modal
      title={t("groups.new.title")}
      opened={opened}
      size="lg"
      onClose={onLocalCancel}
    >
      <TextInput
        value={name}
        onChange={onNameChangeHandler}
        label={t("groups.form.name")}
        placeholder={t("groups.form.name.placeholder")}
      />
      <Checkbox
        my="md"
        onChange={onCheckboxClicked}
        label="For this group create special folders: inbox and home"
      />
      {isError && <Text c="red">{`${error}`}</Text>}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          {t("common.cancel")}
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onLocalSubmit}>
            {t("common.submit")}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
