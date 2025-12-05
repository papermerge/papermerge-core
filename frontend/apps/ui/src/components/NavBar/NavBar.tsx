import {useAppSelector} from "@/app/hooks"
import {useAuth} from "@/app/hooks/useAuth"
import {
  selectBreadcrumbRootType,
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

type BreadcrumbRootType = "home" | "inbox" | "shared"

type ResponsiveLink = ({isActive, isPending}: NavLinkState) => React.JSX.Element
type RenderLinkFunc = (text: string, icon: React.JSX.Element) => ResponsiveLink

interface NavItemProps {
  to: string
  label: string
  icon: React.JSX.Element
  permission: string
  rootType?: BreadcrumbRootType
  renderLink: RenderLinkFunc
  breadcrumbRootType?: BreadcrumbRootType
}

function NavItem({
  to,
  label,
  icon,
  permission,
  rootType,
  renderLink
}: Omit<NavItemProps, "breadcrumbRootType">) {
  const {hasPermission} = useAuth()
  const breadcrumbRootType = useAppSelector(selectBreadcrumbRootType)
  const location = useLocation()
  const [isPending, setIsPending] = useState(false)

  // Reset pending state when location changes
  useEffect(() => {
    setIsPending(false)
  }, [location.pathname])

  if (!hasPermission(permission)) {
    return null
  }

  const isOnRootPath = ["/home", "/inbox", "/shared", "/documents"].some(
    path => location.pathname === path
  )

  const isActiveByBreadcrumb =
    !isOnRootPath && rootType != null && breadcrumbRootType === rootType

  return (
    <NavLink
      to={to}
      className={({isActive}) =>
        isActive || isActiveByBreadcrumb ? "active" : ""
      }
      onClick={() => setIsPending(true)}
    >
      {({isActive}) =>
        renderLink(
          label,
          icon
        )({
          isActive: isActive || isActiveByBreadcrumb,
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
    return <Loader />
  }

  if (status === "failed") {
    return <>{error}</>
  }

  if (!user) {
    return <Loader />
  }
  const item = (
    props: Omit<NavItemProps, "renderLink" | "breadcrumbRootType">
  ) => <NavItem {...props} renderLink={renderLink} />

  return (
    <>
      <div className="navbar">
        {item({
          to: "/documents",
          label: t("documents"),
          icon: <IconFile />,
          permission: NODE_VIEW
        })}
        {item({
          to: "/inbox",
          label: t("inbox.name"),
          icon: <IconInbox />,
          permission: NODE_VIEW,
          rootType: "inbox"
        })}
        {item({
          to: "/home",
          label: t("files"),
          icon: <IconFolder />,
          permission: NODE_VIEW,
          rootType: "home"
        })}
        {item({
          to: "/shared",
          label: t("shared.name"),
          icon: <IconShare />,
          permission: SHARED_NODE_VIEW,
          rootType: "shared"
        })}
        {item({
          to: "/tags",
          label: t("tags.name"),
          icon: <IconTag />,
          permission: TAG_VIEW
        })}
        {item({
          to: "/custom-fields",
          label: t("custom_fields.name"),
          icon: <IconForms />,
          permission: CUSTOM_FIELD_VIEW
        })}
        {item({
          to: "/categories",
          label: t("document_types.name.by"),
          icon: <IconCategory2 />,
          permission: DOCUMENT_TYPE_VIEW
        })}
        {item({
          to: "/users",
          label: t("users.name"),
          icon: <IconUsers />,
          permission: USER_VIEW
        })}
        {item({
          to: "/groups",
          label: t("groups.name"),
          icon: <IconUsersGroup />,
          permission: GROUP_VIEW
        })}
        {item({
          to: "/roles",
          label: t("roles.name"),
          icon: <IconMasksTheater />,
          permission: ROLE_VIEW
        })}
        {item({
          to: "/audit-logs",
          label: t("audit_log.name"),
          icon: <IconClipboardList />,
          permission: AUDIT_LOG_VIEW
        })}
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
    <NavBarContent
      renderLink={(text, icon) => NavLinkWithFeedbackShort(icon)}
    />
  )
}

function NavLinkWithFeedback(
  text: string,
  icon: React.JSX.Element
): ResponsiveLink {
  return ({isActive, isPending}) => {
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
  return ({isActive, isPending}) => {
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
