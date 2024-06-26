import {useSelector} from "react-redux"
import {NavLink} from "react-router-dom"
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
      <ul className="sidebar">
        <li>
          <NavLink to={`/home/${user.home_folder_id}`}>Home</NavLink>
        </li>
        <li>
          <NavLink to={`/inbox/${user.inbox_folder_id}`}>Inbox</NavLink>
        </li>
        <li>
          <NavLink to="/tags">Tags</NavLink>
        </li>
        <li>
          <NavLink to="/groups">Groups</NavLink>
        </li>
        <li>
          <NavLink to="/users">Users</NavLink>
        </li>
      </ul>
    </>
  )
}

export default Sidebar
