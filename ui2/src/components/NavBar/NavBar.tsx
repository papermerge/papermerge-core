import {useSelector} from "react-redux"
import {NavLink} from "react-router-dom"
import {
  IconHome,
  IconInbox,
  IconTag,
  IconUsers,
  IconUsersGroup
} from "@tabler/icons-react"
import {Group} from "@mantine/core"
import {
  selectCurrentUser,
  selectCurrentUserStatus,
  selectCurrentUserError
} from "@/slices/currentUser.ts"
import {selectNavBarCollapsed} from "@/slices/navBar"

import type {User} from "@/types.ts"
import "./NavBar.css"

function NavBarFull() {
  const user = useSelector(selectCurrentUser) as User
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  if (status == "loading") {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <div className="navbar">
        <NavLink to={`/home/${user.home_folder_id}`}>
          <Group>
            <IconHome /> Home
          </Group>
        </NavLink>
        <NavLink to={`/inbox/${user.inbox_folder_id}`}>
          <Group>
            <IconInbox /> Inbox
          </Group>
        </NavLink>
        <NavLink to="/tags">
          <Group>
            <IconTag />
            Tags
          </Group>
        </NavLink>
        <NavLink to="/users">
          <Group>
            <IconUsers />
            Users
          </Group>
        </NavLink>
        <NavLink to="/groups">
          <Group>
            <IconUsersGroup />
            Groups
          </Group>
        </NavLink>
      </div>
    </>
  )
}

function NavBarCollapsed() {
  const user = useSelector(selectCurrentUser) as User
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  if (status == "loading") {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <div className="navbar">
        <NavLink to={`/home/${user.home_folder_id}`}>
          <Group>
            <IconHome />
          </Group>
        </NavLink>
        <NavLink to={`/inbox/${user.inbox_folder_id}`}>
          <Group>
            <IconInbox />
          </Group>
        </NavLink>
        <NavLink to="/tags">
          <Group>
            <IconTag />
          </Group>
        </NavLink>
        <NavLink to="/users">
          <Group>
            <IconUsers />
          </Group>
        </NavLink>
        <NavLink to="/groups">
          <Group>
            <IconUsersGroup />
          </Group>
        </NavLink>
      </div>
    </>
  )
}

function NavBar() {
  const collapsed = useSelector(selectNavBarCollapsed)

  if (collapsed) {
    return <NavBarCollapsed />
  }

  return <NavBarFull />
}

export default NavBar
