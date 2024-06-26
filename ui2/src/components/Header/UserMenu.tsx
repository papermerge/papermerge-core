import {useSelector} from "react-redux"
import {Group, Menu, UnstyledButton} from "@mantine/core"
import {
  IconChevronRight,
  IconUser,
  IconApi,
  IconInfoSquareRounded,
  IconLogout
} from "@tabler/icons-react"
import type {User} from "@/types.ts"

import {
  selectCurrentUser,
  selectCurrentUserStatus,
  selectCurrentUserError
} from "@/slices/currentUser.ts"

export default function UserMenu() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const user = useSelector(selectCurrentUser) as User

  if (status == "loading") {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <Menu withArrow>
      <Menu.Target>
        <UnstyledButton>
          <Group>
            <IconUser />
            {user.username}
            <IconChevronRight size="1rem" />{" "}
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item>
          <Group>
            <IconApi />
            REST API
          </Group>
        </Menu.Item>
        <Menu.Item>
          <Group>
            <IconInfoSquareRounded />
            About
          </Group>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <Group>
            <IconLogout />
            Sign Out
          </Group>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
