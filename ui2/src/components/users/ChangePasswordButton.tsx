import {Button} from "@mantine/core"
import {IconPassword} from "@tabler/icons-react"

export default function ChangePasswordButton() {
  const onClick = () => {}
  return (
    <Button
      leftSection={<IconPassword />}
      onClick={onClick}
      variant={"default"}
    >
      Change Password
    </Button>
  )
}
