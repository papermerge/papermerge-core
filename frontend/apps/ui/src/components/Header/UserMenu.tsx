import type {User} from "@/types.ts"
import {Group, Menu, UnstyledButton} from "@mantine/core"
import {
  IconApi,
  IconChevronRight,
  IconLogout,
  IconSettings,
  IconUser
} from "@tabler/icons-react"
import Cookies from "js-cookie"
import {useSelector} from "react-redux"
import {Link} from "react-router"

import {
  selectCurrentUser,
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts"
import {useTranslation} from "react-i18next"

export default function UserMenu() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const user = useSelector(selectCurrentUser) as User
  const {t} = useTranslation()

  const onSignOutClicked = () => {
    const config = (window as any).__PAPERMERGE_RUNTIME_CONFIG__
    const authType = config?.auth_type || "standard"

    if (authType === "oidc") {
      // OIDC logout: redirect to OAuth2-Proxy's logout endpoint
      // This will clear OAuth2-Proxy session and perform OIDC logout
      window.location.href = "/oauth2/sign_out"
    } else {
      // Standard auth: clear cookie and redirect to login
      Cookies.remove("access_token")
      let a = document.createElement("a")
      a.href = "/login"
      a.click()
    }
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
            <IconSettings />
            <Link to="/preferences/me">
              {t("userMenu.MyPreferences", {defaultValue: "My Preferences"})}
            </Link>
          </Group>
        </Menu.Item>
        <Menu.Item>
          <Group>
            <IconApi />
            <a href="/docs">{t("extra.rest_api")}</a>
          </Group>
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item>
          <Group>
            <IconLogout />
            <a onClick={onSignOutClicked}>{t("extra.logout")}</a>
          </Group>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
