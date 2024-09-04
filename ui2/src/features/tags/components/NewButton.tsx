import {useDisclosure} from "@mantine/hooks"
import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"
import NewTagModal from "./NewTagModal"

export default function NewButton() {
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <Button leftSection={<IconPlus />} onClick={open} variant="default">
        New
      </Button>
      <NewTagModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
