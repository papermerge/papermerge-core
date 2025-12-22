import type { User } from "@/types.ts"
import { Group, Menu, UnstyledButton } from "@mantine/core"
import {
  IconApi,
  IconChevronRight,
  IconLogout,
  IconSettings,
  IconUser
} from "@tabler/icons-react"
import Cookies from "js-cookie"
import { useSelector } from "react-redux"
import { Link } from "react-router"

import {
  selectCurrentUser,
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts"
import { useTranslation } from "react-i18next"

interface RuntimeConfig {
  auth_type?: string
  oidc_logout_url?: string
  oidc_client_id?: string
  post_logout_redirect_uri?: string
}

export default function UserMenu() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const user = useSelector(selectCurrentUser) as User
  const {t} = useTranslation()

  const onSignOutClicked = () => {
    const config: RuntimeConfig =
      (window as any).__PAPERMERGE_RUNTIME_CONFIG__ || {}
    const authType = config.auth_type || "standard"

    if (authType === "oidc") {
      // OIDC logout requires a two-step process:
      // 1. Clear OAuth2-Proxy session via /oauth2/sign_out
      // 2. Redirect to OIDC provider's logout endpoint to clear provider session
      // 3. Provider redirects back to our app
      //
      // The OAuth2-Proxy's /oauth2/sign_out endpoint accepts an `rd` parameter
      // that specifies where to redirect after clearing its session.
      // We redirect to the OIDC provider's logout endpoint, which then
      // redirects back to our app after clearing its session.

      const oidcLogoutUrl = config.oidc_logout_url
      const oidcClientId = config.oidc_client_id
      const postLogoutRedirectUri =
        config.post_logout_redirect_uri || window.location.origin

      if (oidcLogoutUrl) {
        // Construct the OIDC provider logout URL with post_logout_redirect_uri
        // This is the standard OIDC RP-Initiated Logout parameter
        const providerLogoutUrl = new URL(oidcLogoutUrl)
        providerLogoutUrl.searchParams.set(
          "post_logout_redirect_uri",
          postLogoutRedirectUri
        )
        // Keycloak (and some other OIDC providers) require client_id when
        // post_logout_redirect_uri is used without id_token_hint
        if (oidcClientId) {
          providerLogoutUrl.searchParams.set("client_id", oidcClientId)
        }

        // URL-encode the complete provider logout URL for the `rd` parameter
        // The `rd` parameter tells OAuth2-Proxy where to redirect after
        // clearing its own session
        const encodedProviderLogout = encodeURIComponent(
          providerLogoutUrl.toString()
        )

        // Redirect to OAuth2-Proxy's sign_out endpoint with the rd parameter
        window.location.href = `/oauth2/sign_out?rd=${encodedProviderLogout}`
      } else {
        // Fallback: just clear OAuth2-Proxy session without provider logout
        // WARNING: This may not fully log out from the OIDC provider,
        // and the user might be automatically re-logged in.
        console.warn(
          "OIDC logout URL not configured. User may be auto re-logged in."
        )
        window.location.href = "/oauth2/sign_out"
      }
    } else {
      // Standard auth: clear cookie and redirect to login
      Cookies.remove("access_token")
      const a = document.createElement("a")
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
