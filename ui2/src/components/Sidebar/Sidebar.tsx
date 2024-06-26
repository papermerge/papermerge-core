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

import type {User} from "@/types.ts"
import "./Sidebar.css"

function Sidebar() {
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
      <div className="sidebar">
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

export default Sidebar
