import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  commanderViewOptionUpdated,
  selectCommanderViewOption,
  selectNavBarCollapsed
} from "@/features/ui/uiSlice"
import {
  CUSTOM_FIELD_VIEW,
  DOCUMENT_TYPE_VIEW,
  GROUP_VIEW,
  NODE_VIEW,
  TAG_VIEW,
  USER_VIEW
} from "@/scopes"
import {
  selectCurrentUser,
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts"
import {Group, Loader} from "@mantine/core"
import {
  IconAlignJustified,
  IconFile3d,
  IconHome,
  IconInbox,
  IconTag,
  IconUsers,
  IconUsersGroup
} from "@tabler/icons-react"
import {useContext} from "react"
import {useSelector} from "react-redux"
import {NavLink} from "react-router-dom"

import type {User} from "@/types.ts"

function NavBarFull() {
  const mode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const viewOption = useAppSelector(s => selectCommanderViewOption(s, mode))

  const user = useSelector(selectCurrentUser) as User
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  const onClick = () => {
    if (viewOption == "document-type") {
      /*
        Handle situation when user is in "document-type" view mode in commander
        and he/she clicks on "home" or "inbox" folders. In such case
        it is obvious that user intends to switch to "tiles" view

        TODO: instead of switching to tiles, switch to last view options mode
      */
      dispatch(commanderViewOptionUpdated({mode, viewOption: "tile"}))
    }
  }

  if (status == "loading") {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <div className="navbar">
        {user.scopes.includes(NODE_VIEW) && (
          <NavLink to={`/home/${user.home_folder_id}`} onClick={onClick}>
            {NavLinkWithFeedback("Home", <IconHome />)}
          </NavLink>
        )}
        {user.scopes.includes(NODE_VIEW) && (
          <NavLink to={`/inbox/${user.inbox_folder_id}`} onClick={onClick}>
            {NavLinkWithFeedback("Inbox", <IconInbox />)}
          </NavLink>
        )}
        {user.scopes.includes(TAG_VIEW) && (
          <NavLink to="/tags">
            {NavLinkWithFeedback("Tags", <IconTag />)}
          </NavLink>
        )}
        {user.scopes.includes(CUSTOM_FIELD_VIEW) && (
          <NavLink to="/custom-fields">
            {NavLinkWithFeedback("Custom Fields", <IconAlignJustified />)}
          </NavLink>
        )}
        {user.scopes.includes(DOCUMENT_TYPE_VIEW) && (
          <NavLink to="/document-types">
            {NavLinkWithFeedback("Document Types", <IconFile3d />)}
          </NavLink>
        )}
        {user.scopes.includes(USER_VIEW) && (
          <NavLink to="/users">
            {NavLinkWithFeedback("Users", <IconUsers />)}
          </NavLink>
        )}
        {user.scopes.includes(GROUP_VIEW) && (
          <NavLink to="/groups">
            {NavLinkWithFeedback("Groups", <IconUsersGroup />)}
          </NavLink>
        )}
      </div>
    </>
  )
}

function NavBarCollapsed() {
  const mode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const viewOption = useAppSelector(s => selectCommanderViewOption(s, mode))
  const user = useSelector(selectCurrentUser) as User
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  const onClick = () => {
    if (viewOption == "document-type") {
      /*
        Handle situation when user is in "document-type" view mode in commander
        and he/she clicks on "home" or "inbox" folders. In such case
        it is obvious that user intends to switch to "tiles" view

        TODO: instead of switching to tiles, switch to last view options mode
      */
      dispatch(commanderViewOptionUpdated({mode, viewOption: "tile"}))
    }
  }

  if (status == "loading") {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <div className="navbar">
        {user.scopes.includes(NODE_VIEW) && (
          <NavLink to={`/home/${user.home_folder_id}`} onClick={onClick}>
            {NavLinkWithFeedbackShort(<IconHome />)}
          </NavLink>
        )}
        {user.scopes.includes(NODE_VIEW) && (
          <NavLink to={`/inbox/${user.inbox_folder_id}`} onClick={onClick}>
            {NavLinkWithFeedbackShort(<IconInbox />)}
          </NavLink>
        )}
        {user.scopes.includes(TAG_VIEW) && (
          <NavLink to="/tags">{NavLinkWithFeedbackShort(<IconTag />)}</NavLink>
        )}
        {user.scopes.includes(CUSTOM_FIELD_VIEW) && (
          <NavLink to="/custom-fields">
            {NavLinkWithFeedbackShort(<IconAlignJustified />)}
          </NavLink>
        )}
        {user.scopes.includes(DOCUMENT_TYPE_VIEW) && (
          <NavLink to="/document-types">
            {NavLinkWithFeedbackShort(<IconFile3d />)}
          </NavLink>
        )}
        {user.scopes.includes(USER_VIEW) && (
          <NavLink to="/users">
            {NavLinkWithFeedbackShort(<IconUsers />)}
          </NavLink>
        )}
        {user.scopes.includes(GROUP_VIEW) && (
          <NavLink to="/groups">
            {NavLinkWithFeedbackShort(<IconUsersGroup />)}
          </NavLink>
        )}
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
