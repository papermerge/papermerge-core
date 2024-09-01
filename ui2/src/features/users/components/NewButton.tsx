import {Button} from "@mantine/core"
import {IconPlus} from "@tabler/icons-react"
import {openModal} from "@/components/modals/Generic"
import NewUserModal from "./NewUserModal"

export default function NewButton() {
  const onClick = () => {
    openModal<any, {userId: string}>(NewUserModal)
  }
  return (
    <Button leftSection={<IconPlus />} onClick={onClick} variant="default">
      New
    </Button>
  )
}
