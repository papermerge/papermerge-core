import {useEffect, useState} from "react"

import {
  Box,
  Button,
  Checkbox,
  ColorInput,
  ComboboxItem,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  Pill,
  TextInput
} from "@mantine/core"

import {useAppSelector} from "@/app/hooks"
import {OWNER_ME} from "@/cconstants"
import OwnerSelect from "@/components/OwnerSelect"
import {selectCurrentUser} from "@/slices/currentUser"
import {useEditTagMutation, useGetTagQuery} from "@/features/tags/storage/api"
import {useTranslation} from "react-i18next"
import type {Owner} from "@/types"

interface Args {
  tagId: string
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

export default function EditTagModal({
  onSubmit,
  onCancel,
  tagId,
  opened
}: Args) {
  const {t} = useTranslation()
  const {data} = useGetTagQuery(tagId)
  const [updateTag, {isLoading: isLoadingTagUpdate}] = useEditTagMutation()
  const [name, setName] = useState<string>("")
  const currentUser = useAppSelector(selectCurrentUser)

  const [description, setDescription] = useState<string>("")
  const [pinned, setPinned] = useState<boolean>(false)
  const [bgColor, setBgColor] = useState<string>("")
  const [fgColor, setFgColor] = useState<string>("")
  const [owner, setOwner] = useState<Owner>({
    id: currentUser?.id || "",
    type: "user",
    label: "Me"
  })

  useEffect(() => {
    if (data) {
      formReset()
    }
  }, [opened])

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
    const updatedTagData = {
      name,
      pinned,
      description,
      id: data!.id!,
      bg_color: bgColor,
      fg_color: fgColor
    }
    let tagData

    if (owner.value && owner.value != "") {
      tagData = {...updatedTagData, group_id: owner.value}
    } else {
      tagData = updatedTagData
    }

    await updateTag(tagData)
    formReset()
    onSubmit()
  }

  const onLocalCancel = () => {
    onCancel()
  }

  const onOwnerChange = (option: ComboboxItem) => {
    setOwner(option)
  }

  const formReset = () => {
    if (data) {
      setName(data.name || "")
      setBgColor(data.bg_color || "")
      setFgColor(data.fg_color || "")
      setDescription(data.description || "")
      setPinned(data.pinned || false)
      if (data.group_id && data.group_name) {
        setOwner({value: data.group_id, label: data.group_name})
      } else {
        setOwner({value: "", label: OWNER_ME})
      }
    }
  }

  return (
    <Modal title={t("tags.edit.title")} opened={opened} onClose={onLocalCancel}>
      <Box>
        <LoadingOverlay
          visible={data == null}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <TextInput
          label={t("tags.form.name")}
          value={name}
          onChange={e => onNameChange(e.currentTarget.value)}
          placeholder={t("tags.form.name")}
        />
        <ColorInput
          onChange={onBgColorChange}
          label={t("tags.form.background_color")}
          value={bgColor}
          withEyeDropper={false}
        />
        <ColorInput
          onChange={onFgColorChange}
          label={t("tags.form.foreground_color")}
          value={fgColor}
          withEyeDropper={false}
        />
        <Checkbox
          onChange={e => setPinned(e.currentTarget.checked)}
          mt="sm"
          label={t("tags.form.pinned")}
          checked={pinned}
        />
        <TextInput
          mt="sm"
          label={t("tags.form.description")}
          type="email"
          value={description}
          placeholder={t("tags.form.description.placeholder")}
          onChange={e => setDescription(e.currentTarget.value)}
        />
        <Box my="md">
          <Pill size={"lg"} style={{backgroundColor: bgColor, color: fgColor}}>
            {name || "preview"}
          </Pill>
        </Box>
        <OwnerSelect value={owner} onChange={onOwnerChange} />
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onLocalCancel}>
            {t("common.cancel")}
          </Button>
          <Group>
            {isLoadingTagUpdate && <Loader size="sm" />}
            <Button disabled={isLoadingTagUpdate} onClick={onLocalSubmit}>
              {t("common.submit")}
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  )
}
