import {useSelector} from "react-redux"
import {NavLink} from "react-router-dom"
import {
  IconHome,
  IconInbox,
  IconTag,
  IconUsers,
  IconUsersGroup
} from "@tabler/icons-react"
import {Group, Loader} from "@mantine/core"
import {
  selectCurrentUser,
  selectCurrentUserStatus,
  selectCurrentUserError
} from "@/slices/currentUser.ts"
import {selectNavBarCollapsed} from "@/slices/navBar"

import type {User} from "@/types.ts"

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
          {NavLinkWithFeedback("Home", <IconHome />)}
        </NavLink>
        <NavLink to={`/inbox/${user.inbox_folder_id}`}>
          {NavLinkWithFeedback("Inbox", <IconInbox />)}
        </NavLink>
        <NavLink to="/tags">{NavLinkWithFeedback("Tags", <IconTag />)}</NavLink>
        <NavLink to="/users">
          {NavLinkWithFeedback("Users", <IconUsers />)}
        </NavLink>
        <NavLink to="/groups">
          {NavLinkWithFeedback("Groups", <IconUsersGroup />)}
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
          {NavLinkWithFeedbackShort(<IconHome />)}
        </NavLink>
        <NavLink to={`/inbox/${user.inbox_folder_id}`}>
          {NavLinkWithFeedbackShort(<IconInbox />)}
        </NavLink>
        <NavLink to="/tags">{NavLinkWithFeedbackShort(<IconTag />)}</NavLink>
        <NavLink to="/users">{NavLinkWithFeedbackShort(<IconUsers />)}</NavLink>
        <NavLink to="/groups">
          {NavLinkWithFeedbackShort(<IconUsersGroup />)}
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

type NavLinkState = {
  isActive: boolean
  isPending: boolean
}

type ResponsiveLink = ({isActive, isPending}: NavLinkState) => JSX.Element

function NavLinkWithFeedback(text: string, icon: JSX.Element): ResponsiveLink {
  return ({isActive, isPending}) => {
    if (isActive) {
      return (
        <Group>
          {icon}
          {text}
        </Group>
      )
    }
    if (isPending) {
      return (
        <Group>
          {icon}
          {text}
          <Loader size={"sm"} />
        </Group>
      )
    }
    return (
      <Group>
        {icon}
        {text}
      </Group>
    )
  }
}

function NavLinkWithFeedbackShort(icon: JSX.Element): ResponsiveLink {
  return ({isActive, isPending}) => {
    if (isActive) {
      return <Group>{icon}</Group>
    }
    if (isPending) {
      return (
        <Group>
          <Loader size={"sm"} />
        </Group>
      )
    }
    return <Group>{icon}</Group>
  }
}

export default NavBar
