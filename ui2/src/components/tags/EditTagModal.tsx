import {useState, useEffect} from "react"
import {useDispatch, useSelector} from "react-redux"

import {
  Checkbox,
  Group,
  Button,
  Modal,
  TextInput,
  ColorInput,
  Pill,
  Box,
  LoadingOverlay
} from "@mantine/core"

import {selectTagDetails} from "@/slices/tagDetails"
import {updateTag} from "@/slices/tags"
import {RootState} from "@/app/types"
import type {ColoredTagType, SliceState} from "@/types"

type Args = {
  onOK: (value: ColoredTagType) => void
  onCancel: (reason?: any) => void
}

export default function EditTagModal({onOK, onCancel}: Args) {
  const [name, setName] = useState<string>("")
  const {status, data} = useSelector<RootState>(
    selectTagDetails
  ) as SliceState<ColoredTagType>
  const [description, setDescription] = useState<string>("")
  const [pinned, setPinned] = useState<boolean>(false)
  const [bgColor, setBgColor] = useState<string>("")
  const [fgColor, setFgColor] = useState<string>("")
  const dispatch = useDispatch()
  const [show, setShow] = useState<boolean>(true)

  useEffect(() => {
    if (data) {
      setName(data.name || "")
      setBgColor(data.bg_color || "")
      setFgColor(data.fg_color || "")
      setDescription(data.description || "")
      setPinned(data.pinned)
    }
  }, [status])

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
    const updatedTagData = {
      name,
      pinned,
      description,
      id: data!.id!,
      bg_color: bgColor,
      fg_color: fgColor
    }

    const response = await dispatch(updateTag(updatedTagData))
    const tagDetailsData = response.payload as ColoredTagType

    onOK(tagDetailsData)
    setShow(false)
  }
  const onClose = () => {
    onCancel()
    setShow(false)
  }

  return (
    <Modal title={"Edit Tag"} opened={show} onClose={onClose}>
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
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Submit</Button>
        </Group>
      </Box>
    </Modal>
  )
}
