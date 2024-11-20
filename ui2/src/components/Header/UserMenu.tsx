import type {User} from "@/types.ts"
import {Group, Menu, UnstyledButton} from "@mantine/core"
import {
  IconApi,
  IconChevronRight,
  IconLogout,
  IconUser
} from "@tabler/icons-react"
import Cookies from "js-cookie"
import {useSelector} from "react-redux"

import {
  selectCurrentUser,
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts"

export default function UserMenu() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const user = useSelector(selectCurrentUser) as User

  const onSignOutClicked = () => {
    Cookies.remove("access_token")
    let a = document.createElement("a")
    a.href = "/login"
    a.click()
  }

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
            <a href="/docs">REST API</a>
          </Group>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <Group>
            <IconLogout />
            <a onClick={onSignOutClicked}>Sign Out</a>
          </Group>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
