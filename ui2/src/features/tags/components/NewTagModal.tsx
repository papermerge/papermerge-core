import {useState, useEffect} from "react"

import {
  Text,
  Loader,
  Checkbox,
  Group,
  Button,
  Modal,
  TextInput,
  ColorInput,
  Pill,
  Box
} from "@mantine/core"
import {useAddNewTagMutation} from "@/features/tags/apiSlice"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewTagModal({onSubmit, onCancel, opened}: Args) {
  const {t} = useTranslation()
  const [addNewTag, {isLoading, isError, isSuccess}] = useAddNewTagMutation()
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [pinned, setPinned] = useState<boolean>(false)
  const [bgColor, setBgColor] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [fgColor, setFgColor] = useState<string>("")

  useEffect(() => {
    // close dialog as soon as we have
    // "success" status from the mutation
    if (isSuccess) {
      onSubmit()
      reset()
    }
  }, [isSuccess])

  const onNameChange = (value: string) => {
    setName(value)
  }

  const onBgColorChange = (value: string) => {
    setBgColor(value)
  }

  const onFgColorChange = (value: string) => {
    setFgColor(value)
  }

  const onLocalSubmit = async () => {
    const newTagData = {
      name,
      pinned,
      description,
      bg_color: bgColor,
      fg_color: fgColor
    }
    try {
      await addNewTag(newTagData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const reset = () => {
    setName("")
    setDescription("")
    setPinned(false)
    setBgColor("")
    setFgColor("")
    setError("")
  }

  return (
    <Modal title={t("tags.new.title")} opened={opened} onClose={onLocalCancel}>
      <TextInput
        label={t("tags.form.name")}
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder={t("tags.form.name")}
      />
      <ColorInput
        onChange={onBgColorChange}
        label={t("tags.form.background_color")}
        withEyeDropper={false}
      />
      <ColorInput
        onChange={onFgColorChange}
        label={t("tags.form.foreground_color")}
        withEyeDropper={false}
      />
      <Checkbox
        onChange={e => setPinned(e.currentTarget.checked)}
        mt="sm"
        label={t("tags.form.pinned")}
      />
      <TextInput
        mt="sm"
        label={t("tags.form.description")}
        type="email"
        placeholder={t("tags.form.description.placeholder")}
        onChange={e => setDescription(e.currentTarget.value)}
      />
      <Box my="md">
        <Pill size={"lg"} style={{backgroundColor: bgColor, color: fgColor}}>
          {name || ""}
        </Pill>
      </Box>
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
