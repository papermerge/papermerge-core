import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useAuth} from "@/app/hooks/useAuth"
import PanelContext from "@/contexts/PanelContext"
import {
  commanderViewOptionUpdated,
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
import {
  IconAlignJustified,
  IconFile,
  IconFolder,
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

type NavLinkState = {
  isActive: boolean
  isPending: boolean
}

type ResponsiveLink = ({isActive, isPending}: NavLinkState) => React.JSX.Element
type RenderLinkFunc = (text: string, icon: React.JSX.Element) => ResponsiveLink

interface Args {
  renderLink: RenderLinkFunc
  withVersion?: boolean
}

/**
 * Core NavBar content component
 * Accepts a render function to customize how links are displayed (full vs collapsed)
 */
function NavBarContent({renderLink, withVersion}: Args) {
  const {t} = useTranslation()
  const mode = useContext(PanelContext)
  const {user, hasPermission} = useAuth()
  const dispatch = useAppDispatch()
  const {data, isLoading} = useGetVersionQuery()
  const viewOption = useAppSelector(s => selectCommanderViewOption(s, mode))
  const lastHome = useAppSelector(s => selectLastHome(s, "main"))
  const lastInbox = useAppSelector(s => selectLastInbox(s, "main"))

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
    return <Loader />
  }

  if (status == "failed") {
    return <>{error}</>
  }

  if (!user) {
    return <Loader />
  }

  return (
    <>
      <div className="navbar">
        {hasPermission(NODE_VIEW) && (
          <NavLink to={`/documents/`} onClick={onClick}>
            {renderLink(t("documents"), <IconFile />)}
          </NavLink>
        )}
        {hasPermission(NODE_VIEW) && (
          <NavLink
            to={`/inbox/${lastInbox?.inbox_id || user.inbox_folder_id}`}
            onClick={onClick}
          >
            {renderLink(t("inbox.name"), <IconInbox />)}
          </NavLink>
        )}
        {hasPermission(NODE_VIEW) && (
          <NavLink
            to={`/home/${lastHome?.home_id || user.home_folder_id}`}
            onClick={onClick}
          >
            {renderLink(t("files"), <IconFolder />)}
          </NavLink>
        )}
        {hasPermission(SHARED_NODE_VIEW) && (
          <NavLink to={"/shared"} onClick={onClick}>
            {renderLink(t("shared.name"), <IconUserShare />)}
          </NavLink>
        )}
        {hasPermission(TAG_VIEW) && (
          <NavLink to="/tags">
            {renderLink(t("tags.name"), <IconTag />)}
          </NavLink>
        )}
        {hasPermission(CUSTOM_FIELD_VIEW) && (
          <NavLink to="/custom-fields">
            {renderLink(t("custom_fields.name"), <IconAlignJustified />)}
          </NavLink>
        )}
        {hasPermission(DOCUMENT_TYPE_VIEW) && (
          <NavLink to="/categories">
            {renderLink(
              t("document_types.name.by"),
              <IconTriangleSquareCircle />
            )}
          </NavLink>
        )}
        {hasPermission(USER_VIEW) && (
          <NavLink to="/users">
            {renderLink(t("users.name"), <IconUsers />)}
          </NavLink>
        )}
        {hasPermission(GROUP_VIEW) && (
          <NavLink to="/groups">
            {renderLink(t("groups.name"), <IconUsersGroup />)}
          </NavLink>
        )}
        {hasPermission(ROLE_VIEW) && (
          <NavLink to="/roles">
            {renderLink(t("roles.name"), <IconMasksTheater />)}
          </NavLink>
        )}
        {hasPermission(AUDIT_LOG_VIEW) && (
          <NavLink to="/audit-logs">
            {renderLink(t("audit_log.name"), <IconLogs />)}
          </NavLink>
        )}
      </div>
      {withVersion && (
        <Center className="navbar-bg-color">
          <Text size="sm" c="dimmed">
            {t("app.version")} {data && data?.version}
          </Text>
        </Center>
      )}
    </>
  )
}

function NavBarFull() {
  return <NavBarContent renderLink={NavLinkWithFeedback} withVersion />
}

function NavBarCollapsed() {
  return (
    <NavBarContent
      renderLink={(text, icon) => NavLinkWithFeedbackShort(icon)}
    />
  )
}

function NavBar() {
  const collapsed = useSelector(selectNavBarCollapsed)

  if (collapsed) {
    return <NavBarCollapsed />
  }

  return <NavBarFull />
}

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
