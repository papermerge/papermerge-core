import {useAppDispatch, useAppSelector} from "@/app/hooks"
import PanelContext from "@/contexts/PanelContext"
import {
  commanderViewOptionUpdated,
  selectCommanderDocumentTypeID,
  selectCommanderViewOption,
  selectLastHome,
  selectLastInbox,
  selectNavBarCollapsed
} from "@/features/ui/uiSlice"
import {
  AUDIT_LOG_VIEW,
  CUSTOM_FIELD_VIEW,
  DOCUMENT_TYPE_VIEW,
  GROUP_VIEW,
  NODE_VIEW,
  ROLE_VIEW,
  SHARED_NODE_VIEW,
  TAG_VIEW,
  USER_VIEW
} from "@/scopes"
import {
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts"
import {Center, Group, Loader, Text} from "@mantine/core"
import {useAuth} from "@/app/hooks/useAuth"
import {
  IconAlignJustified,
  IconFile,
  IconHome,
  IconInbox,
  IconLogs,
  IconMasksTheater,
  IconTag,
  IconTriangleSquareCircle,
  IconUsers,
  IconUsersGroup,
  IconUserShare
} from "@tabler/icons-react"
import {useContext} from "react"
import {useSelector} from "react-redux"
import {NavLink} from "react-router-dom"

import {useGetVersionQuery} from "@/features/version/apiSlice"
import {useTranslation} from "react-i18next"

function NavBarFull() {
  const {t} = useTranslation()
  const mode = useContext(PanelContext)
  const {user, hasPermission} = useAuth()
  const dispatch = useAppDispatch()
  const {data, isLoading} = useGetVersionQuery()
  const viewOption = useAppSelector(s => selectCommanderViewOption(s, mode))
  const lastHome = useAppSelector(s => selectLastHome(s, "main"))
  const lastInbox = useAppSelector(s => selectLastInbox(s, "main"))
  const categoryID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, "main")
  )
  const categoryURL = categoryID
    ? `/documents/by/category/${categoryID}`
    : "/documents/by/category"

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

  if (status == "loading" || isLoading) {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  if (!user) {
    return <>Loading...</>
  }

  return (
    <>
      <div className="navbar">
        {hasPermission(NODE_VIEW) && (
          <NavLink
            to={`/home/${lastHome?.home_id || user.home_folder_id}`}
            onClick={onClick}
          >
            {NavLinkWithFeedback(t("home.name"), <IconHome />)}
          </NavLink>
        )}
        {hasPermission(NODE_VIEW) && (
          <NavLink
            to={`/inbox/${lastInbox?.inbox_id || user.inbox_folder_id}`}
            onClick={onClick}
          >
            {NavLinkWithFeedback(t("inbox.name"), <IconInbox />)}
          </NavLink>
        )}
        {hasPermission(NODE_VIEW) && (
          <NavLink to={categoryURL} onClick={onClick}>
            {NavLinkWithFeedback(t("documents"), <IconFile />)}
          </NavLink>
        )}
        {hasPermission(SHARED_NODE_VIEW) && (
          <NavLink to={"/shared"} onClick={onClick}>
            {NavLinkWithFeedback(t("shared.name"), <IconUserShare />)}
          </NavLink>
        )}
        {hasPermission(TAG_VIEW) && (
          <NavLink to="/tags">
            {NavLinkWithFeedback(t("tags.name"), <IconTag />)}
          </NavLink>
        )}
        {hasPermission(CUSTOM_FIELD_VIEW) && (
          <NavLink to="/custom-fields">
            {NavLinkWithFeedback(
              t("custom_fields.name"),
              <IconAlignJustified />
            )}
          </NavLink>
        )}
        {hasPermission(DOCUMENT_TYPE_VIEW) && (
          <NavLink to="/categories">
            {NavLinkWithFeedback(
              t("document_types.name.by"),
              <IconTriangleSquareCircle />
            )}
          </NavLink>
        )}
        {hasPermission(USER_VIEW) && (
          <NavLink to="/users">
            {NavLinkWithFeedback(t("users.name"), <IconUsers />)}
          </NavLink>
        )}
        {hasPermission(GROUP_VIEW) && (
          <NavLink to="/groups">
            {NavLinkWithFeedback(t("groups.name"), <IconUsersGroup />)}
          </NavLink>
        )}
        {hasPermission(ROLE_VIEW) && (
          <NavLink to="/roles">
            {NavLinkWithFeedback(t("roles.name"), <IconMasksTheater />)}
          </NavLink>
        )}
        {hasPermission(AUDIT_LOG_VIEW) && (
          <NavLink to="/audit-logs">
            {NavLinkWithFeedback(t("audit_log.name"), <IconLogs />)}
          </NavLink>
        )}
      </div>
      <Center className="navbar-bg-color">
        <Text size="sm" c="dimmed">
          {t("app.version")} {data && data?.version}
        </Text>
      </Center>
    </>
  )
}

function NavBarCollapsed() {
  const mode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const {user, hasPermission} = useAuth()
  const {data, isLoading} = useGetVersionQuery()
  const viewOption = useAppSelector(s => selectCommanderViewOption(s, mode))

  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const categoryID = useAppSelector(s =>
    selectCommanderDocumentTypeID(s, "main")
  )
  const categoryURL = categoryID
    ? `/documents/by/category/${categoryID}`
    : "/documents/by/category"

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

  if (status == "loading" || isLoading) {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  if (!user) {
    return <>Loading...</>
  }

  return (
    <>
      <div className="navbar">
        {hasPermission(NODE_VIEW) && (
          <NavLink to={`/home/${user.home_folder_id}`} onClick={onClick}>
            {NavLinkWithFeedbackShort(<IconHome />)}
          </NavLink>
        )}
        {hasPermission(NODE_VIEW) && (
          <NavLink to={`/inbox/${user.inbox_folder_id}`} onClick={onClick}>
            {NavLinkWithFeedbackShort(<IconInbox />)}
          </NavLink>
        )}
        {hasPermission(NODE_VIEW) && (
          <NavLink to={categoryURL} onClick={onClick}>
            {NavLinkWithFeedbackShort(<IconFile />)}
          </NavLink>
        )}
        {hasPermission(SHARED_NODE_VIEW) && (
          <NavLink to={"/shared"} onClick={onClick}>
            {NavLinkWithFeedbackShort(<IconUserShare />)}
          </NavLink>
        )}
        {hasPermission(TAG_VIEW) && (
          <NavLink to="/tags">{NavLinkWithFeedbackShort(<IconTag />)}</NavLink>
        )}
        {hasPermission(CUSTOM_FIELD_VIEW) && (
          <NavLink to="/custom-fields">
            {NavLinkWithFeedbackShort(<IconAlignJustified />)}
          </NavLink>
        )}
        {hasPermission(DOCUMENT_TYPE_VIEW) && (
          <NavLink to="/categories">
            {NavLinkWithFeedbackShort(<IconTriangleSquareCircle />)}
          </NavLink>
        )}
        {hasPermission(USER_VIEW) && (
          <NavLink to="/users">
            {NavLinkWithFeedbackShort(<IconUsers />)}
          </NavLink>
        )}
        {hasPermission(GROUP_VIEW) && (
          <NavLink to="/groups">
            {NavLinkWithFeedbackShort(<IconUsersGroup />)}
          </NavLink>
        )}
        {hasPermission(ROLE_VIEW) && (
          <NavLink to="/roles">
            {NavLinkWithFeedbackShort(<IconMasksTheater />)}
          </NavLink>
        )}
        {hasPermission(AUDIT_LOG_VIEW) && (
          <NavLink to="/audit-logs">
            {NavLinkWithFeedbackShort(<IconLogs />)}
          </NavLink>
        )}
      </div>
      <Center className="navbar-bg-color">
        <Text size="sm" c="dimmed">
          {data && data?.version}
        </Text>
      </Center>
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

type ResponsiveLink = ({isActive, isPending}: NavLinkState) => React.JSX.Element

function NavLinkWithFeedback(
  text: string,
  icon: React.JSX.Element
): ResponsiveLink {
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

function NavLinkWithFeedbackShort(icon: React.JSX.Element): ResponsiveLink {
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
