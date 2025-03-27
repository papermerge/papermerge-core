import {useEffect, useState} from "react"

import {OWNER_ME} from "@/cconstants"
import OwnerSelector from "@/components/OwnerSelect/OwnerSelect"
import {useAddNewTagMutation} from "@/features/tags/apiSlice"
import {
  Box,
  Button,
  Checkbox,
  ColorInput,
  ComboboxItem,
  Group,
  Loader,
  Modal,
  Pill,
  Text,
  TextInput
} from "@mantine/core"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewTagModal({onSubmit, onCancel, opened}: Args) {
  const [addNewTag, {isLoading, isError, isSuccess}] = useAddNewTagMutation()
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [pinned, setPinned] = useState<boolean>(false)
  const [bgColor, setBgColor] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [fgColor, setFgColor] = useState<string>("")
  const [owner, setOwner] = useState<ComboboxItem>({label: OWNER_ME, value: ""})

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

  const onOwnerChange = (option: ComboboxItem) => {
    setOwner(option)
    console.log(option)
  }

  const onLocalSubmit = async () => {
    const newTagData = {
      name,
      pinned,
      description,
      bg_color: bgColor,
      fg_color: fgColor
    }
    let tagData

    if (owner.value && owner.value != "") {
      tagData = {...newTagData, group_id: owner.value}
    } else {
      tagData = newTagData
    }

    try {
      await addNewTag(tagData).unwrap()
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
    <Modal title={"New Tag"} opened={opened} onClose={onLocalCancel}>
      <TextInput
        label="Name"
        onChange={e => onNameChange(e.currentTarget.value)}
        placeholder="Name"
      />
      <ColorInput
        onChange={onBgColorChange}
        label="Background color"
        withEyeDropper={false}
      />
      <ColorInput
        onChange={onFgColorChange}
        label="Foreground color"
        withEyeDropper={false}
      />
      <Checkbox
        onChange={e => setPinned(e.currentTarget.checked)}
        mt="sm"
        label="Pinned"
      />
      <TextInput
        mt="sm"
        label="Description"
        type="email"
        placeholder="Short description"
        onChange={e => setDescription(e.currentTarget.value)}
      />
      <Box my="md">
        <Pill size={"lg"} style={{backgroundColor: bgColor, color: fgColor}}>
          {name || ""}
        </Pill>
      </Box>
      <OwnerSelector value={owner} onChange={onOwnerChange} />
      {isError && <Text c="red">{`${error}`}</Text>}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onLocalCancel}>
          Cancel
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onLocalSubmit}>
            Submit
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
