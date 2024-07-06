import {useState} from "react"
import {useDispatch} from "react-redux"

import {
  Checkbox,
  Group,
  Button,
  Modal,
  TextInput,
  ColorInput,
  Pill,
  Box
} from "@mantine/core"

import {addTag} from "@/slices/tags"

import type {ColoredTagType} from "@/types"

type Args = {
  onOK: (value: ColoredTagType) => void
  onCancel: (reason?: any) => void
}

export default function NewTagModal({onOK, onCancel}: Args) {
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [pinned, setPinned] = useState<boolean>(false)
  const [bgColor, setBgColor] = useState<string>("")
  const [fgColor, setFgColor] = useState<string>("")
  const dispatch = useDispatch()
  const [show, setShow] = useState<boolean>(true)

  const onNameChange = (value: string) => {
    setName(value)
  }

  const onBgColorChange = (value: string) => {
    setBgColor(value)
  }

  const onFgColorChange = (value: string) => {
    setFgColor(value)
  }

  const onSubmit = async () => {
    const newTagData = {
      name,
      pinned,
      description,
      bg_color: bgColor,
      fg_color: fgColor
    }

    const response = await dispatch(addTag(newTagData))
    const tagDetailsData = response.payload as ColoredTagType

    onOK(tagDetailsData)
    setShow(false)
  }
  const onClose = () => {
    onCancel()
    setShow(false)
  }

  return (
    <Modal title={"New Tag"} opened={show} onClose={onClose}>
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
          {name || "preview"}
        </Pill>
      </Box>
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Submit</Button>
      </Group>
    </Modal>
  )
}
