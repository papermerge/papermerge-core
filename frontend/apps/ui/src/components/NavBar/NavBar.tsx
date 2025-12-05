import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useAuth} from "@/app/hooks/useAuth"
import {
  selectNavBarCollapsed,
  selectNavBarLastMenuItem,
  updateCurrentNavBarMenuItem
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
import {BreadcrumbRootType} from "@/types"
import {Center, Group, Loader, Skeleton, Text} from "@mantine/core"
import {
  IconCategory2,
  IconClipboardList,
  IconFile,
  IconFolder,
  IconForms,
  IconInbox,
  IconMasksTheater,
  IconShare,
  IconTag,
  IconUsers,
  IconUsersGroup
} from "@tabler/icons-react"
import {useEffect, useState} from "react"

import {useSelector} from "react-redux"
import {NavLink, useLocation} from "react-router-dom"

import {useGetVersionQuery} from "@/features/version/apiSlice"
import {useTranslation} from "react-i18next"

export default function NavBar() {
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
type RenderLinkFunc = (text: string, icon: React.JSX.Element) => ResponsiveLink

interface NavItemArgs {
  to: string
  label: string
  icon: React.JSX.Element
  permission: string
  rootType?: BreadcrumbRootType
  renderLink: RenderLinkFunc
}

function NavItem({
  to,
  label,
  icon,
  permission,
  rootType,
  renderLink
}: NavItemArgs) {
  const dispatch = useAppDispatch()
  const {hasPermission} = useAuth()
  const lastCurrentMenuItem = useAppSelector(selectNavBarLastMenuItem)

  const location = useLocation()
  const [isPending, setIsPending] = useState(false)

  // Reset pending state when location changes
  useEffect(() => {
    setIsPending(false)
  }, [location.pathname])

  if (!hasPermission(permission)) {
    return null
  }

  const onClick = () => {
    setIsPending(true)
    dispatch(updateCurrentNavBarMenuItem(to))
  }

  const isActiveByLastMenuItemState = lastCurrentMenuItem == to && !isPending

  return (
    <NavLink
      to={to}
      className={({isActive}) =>
        isActive || isActiveByLastMenuItemState ? "active" : ""
      }
      onClick={onClick}
    >
      {({isActive}) =>
        renderLink(
          label,
          icon
        )({
          isActive: isActive || isActiveByLastMenuItemState,
          isPending: isPending && !isActive
        })
      }
    </NavLink>
  )
}

interface Args {
  renderLink: RenderLinkFunc
  withVersion?: boolean
}

function NavBarContent({renderLink, withVersion}: Args) {
  const {t} = useTranslation()
  const {user} = useAuth()
  const {data, isLoading} = useGetVersionQuery()

  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  if (status === "loading" || isLoading) {
    return <LoadingNavBar />
  }

  if (status === "failed") {
    return <>{error}</>
  }

  if (!user) {
    return <LoadingNavBar />
  }

  return (
    <>
      <div className="navbar">
        <NavItem
          to={"/documents"}
          label={t("documents")}
          icon={<IconFile />}
          permission={NODE_VIEW}
          renderLink={renderLink}
        />

        <NavItem
          to="/inbox"
          label={t("inbox.name")}
          icon={<IconInbox />}
          permission={NODE_VIEW}
          rootType="inbox"
          renderLink={renderLink}
        />
        <NavItem
          to="/home"
          label={t("files")}
          icon={<IconFolder />}
          permission={NODE_VIEW}
          rootType="home"
          renderLink={renderLink}
        />
        <NavItem
          to="/shared"
          label={t("shared.name")}
          icon={<IconShare />}
          permission={SHARED_NODE_VIEW}
          rootType="shared"
          renderLink={renderLink}
        />
        <NavItem
          to="/tags"
          label={t("tags.name")}
          icon={<IconTag />}
          permission={TAG_VIEW}
          renderLink={renderLink}
        />
        <NavItem
          to="/custom-fields"
          label={t("custom_fields.name")}
          icon={<IconForms />}
          permission={CUSTOM_FIELD_VIEW}
          renderLink={renderLink}
        />
        <NavItem
          to="/categories"
          label={t("document_types.name.by")}
          icon={<IconCategory2 />}
          permission={DOCUMENT_TYPE_VIEW}
          renderLink={renderLink}
        />
        <NavItem
          to="/users"
          label={t("users.name")}
          icon={<IconUsers />}
          permission={USER_VIEW}
          renderLink={renderLink}
        />
        <NavItem
          to="/groups"
          label={t("groups.name")}
          icon={<IconUsersGroup />}
          permission={GROUP_VIEW}
          renderLink={renderLink}
        />
        <NavItem
          to="/roles"
          label={t("roles.name")}
          icon={<IconMasksTheater />}
          permission={ROLE_VIEW}
          renderLink={renderLink}
        />
        <NavItem
          to="/audit-logs"
          label={t("audit_log.name")}
          icon={<IconClipboardList />}
          permission={AUDIT_LOG_VIEW}
          renderLink={renderLink}
        />
      </div>
      {withVersion && (
        <Center className="navbar-bg-color">
          <Text size="sm" c="dimmed">
            {t("app.version")} {data?.version}
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
    <NavBarContent renderLink={(_, icon) => NavLinkWithFeedbackShort(icon)} />
  )
}

function NavLinkWithFeedback(
  text: string,
  icon: React.JSX.Element
): ResponsiveLink {
  return ({isPending}) => {
    if (isPending) {
      return (
        <Group>
          <Loader size="sm" />
          {text}
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
  return ({isPending}) => {
    if (isPending) {
      return (
        <Group>
          <Loader size="sm" />
        </Group>
      )
    }
    return <Group>{icon}</Group>
  }
}

function LoadingNavBar() {
  const collapsed = useSelector(selectNavBarCollapsed)
  const width = collapsed ? "2rem" : "7rem"
  return (
    <>
      <div className="navbar">
        <Skeleton height={"1.5rem"} m={"xs"} width={width} />
        <Skeleton height={"1.5rem"} m={"xs"} width={width} />
        <Skeleton height={"1.5rem"} m={"xs"} width={width} />
        <Skeleton height={"1.5rem"} m={"xs"} width={width} />
        <Skeleton height={"1.5rem"} m={"xs"} width={width} />
      </div>
    </>
  )
}
