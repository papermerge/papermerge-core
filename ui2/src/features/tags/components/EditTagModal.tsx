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

import {OWNER_ME} from "@/cconstants"
import OwnerSelector from "@/components/OwnerSelect/OwnerSelect"
import {useEditTagMutation, useGetTagQuery} from "@/features/tags/apiSlice"

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
  const {data} = useGetTagQuery(tagId)
  const [updateTag, {isLoading: isLoadingTagUpdate}] = useEditTagMutation()
  const [name, setName] = useState<string>("")

  const [description, setDescription] = useState<string>("")
  const [pinned, setPinned] = useState<boolean>(false)
  const [bgColor, setBgColor] = useState<string>("")
  const [fgColor, setFgColor] = useState<string>("")
  const [owner, setOwner] = useState<ComboboxItem>({label: OWNER_ME, value: ""})

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
    <Modal title={"Edit Tag"} opened={opened} onClose={onLocalCancel}>
      <Box>
        <LoadingOverlay
          visible={data == null}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <TextInput
          label="Name"
          value={name}
          onChange={e => onNameChange(e.currentTarget.value)}
          placeholder="Name"
        />
        <ColorInput
          onChange={onBgColorChange}
          label="Background color"
          value={bgColor}
          withEyeDropper={false}
        />
        <ColorInput
          onChange={onFgColorChange}
          label="Foreground color"
          value={fgColor}
          withEyeDropper={false}
        />
        <Checkbox
          onChange={e => setPinned(e.currentTarget.checked)}
          mt="sm"
          label="Pinned"
          checked={pinned}
        />
        <TextInput
          mt="sm"
          label="Description"
          type="email"
          value={description}
          placeholder="Short description"
          onChange={e => setDescription(e.currentTarget.value)}
        />
        <Box my="md">
          <Pill size={"lg"} style={{backgroundColor: bgColor, color: fgColor}}>
            {name || "preview"}
          </Pill>
        </Box>
        <OwnerSelector value={owner} onChange={onOwnerChange} />
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onLocalCancel}>
            Cancel
          </Button>
          <Group>
            {isLoadingTagUpdate && <Loader size="sm" />}
            <Button disabled={isLoadingTagUpdate} onClick={onLocalSubmit}>
              Submit
            </Button>
          </Group>
        </Group>
      </Box>
    </Modal>
  )
}
