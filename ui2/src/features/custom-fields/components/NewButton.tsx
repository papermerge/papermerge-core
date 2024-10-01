import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconPlus} from "@tabler/icons-react"
import NewCustomFieldModal from "./NewCustomFieldModal"

export default function NewButton() {
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <>
      <Button leftSection={<IconPlus />} onClick={open} variant="default">
        New
      </Button>
      <NewCustomFieldModal opened={opened} onSubmit={close} onCancel={close} />
    </>
  )
}
