import {useDisclosure} from "@mantine/hooks"
import {Button, Center, Stack} from "@mantine/core"
import {useSelector} from "react-redux"
import {selectAllGroups} from "@/slices/groups"
import GroupModal from "./GroupModal"

export default function Groups() {
  const [opened, handlers] = useDisclosure(false)
  const groups = useSelector(selectAllGroups)

  if (groups.length == 0) {
    return (
      <div>
        <EmptyGroups onClick={handlers.open} />
        <GroupModal opened={opened} onClose={handlers.close} />
      </div>
    )
  }

  return <div>Groups</div>
}

type Args = {
  onClick: () => void
}

function EmptyGroups({onClick}: Args) {
  return (
    <Center>
      <Stack align="center">
        <div>Current there are no groups</div>

        <div>
          <Button onClick={() => onClick()}>Create Group</Button>
        </div>
      </Stack>
    </Center>
  )
}
